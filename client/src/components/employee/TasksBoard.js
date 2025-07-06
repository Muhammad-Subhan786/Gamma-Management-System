import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../../services/api';
import { Calendar, Clock, StickyNote, User, MessageCircle, CheckCircle } from 'lucide-react';
import Avatar from './Avatar';

const columns = [
  { id: 'tasks', title: 'Tasks', color: 'blue' },
  { id: 'done', title: 'Done', color: 'green' },
  { id: 'complete', title: 'Complete', color: 'purple' },
];

function formatDateTime(dt) {
  if (!dt) return 'N/A';
  const d = new Date(dt);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const TasksBoard = ({ employee }) => {
  const [tasks, setTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTask, setModalTask] = useState(null);

  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await tasksAPI.getAll();
      setTasks(data.filter(t => t.assignedTo && t.assignedTo._id === employee._id));
    } catch (err) {
      setTasks([]);
      setError('Failed to load tasks. Please try again.');
    }
    setLoading(false);
  };

  const onDragStart = (task) => setDraggedTask(task);
  const onDrop = async (colId) => {
    if (draggedTask) {
      try {
        await tasksAPI.move(draggedTask._id, colId);
        setTasks(tasks.map(t => t._id === draggedTask._id ? { ...t, status: colId } : t));
      } catch {}
      setDraggedTask(null);
    }
  };

  const openModal = (task = null) => {
    setModalTask(task);
    setShowModal(true);
  };
  const closeModal = () => {
    setModalTask(null);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      setTasks(tasks.filter(t => t._id !== id));
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { title, description, due, dueTime, notes } = e.target.elements;
    let dueDateTime = due.value;
    if (due.value && dueTime.value) dueDateTime += 'T' + dueTime.value;
    const taskData = {
      title: title.value,
      description: description.value,
      due: dueDateTime || undefined,
      notes: notes.value,
    };
    try {
      if (modalTask && modalTask._id) {
        await tasksAPI.update(modalTask._id, taskData);
      } else {
        await tasksAPI.create({ ...taskData, assignedTo: employee._id });
      }
      closeModal();
      fetchTasks();
    } catch {}
  };

  const isOverdue = (task) => {
    if (!task.due) return false;
    return new Date(task.due) < new Date() && task.status !== 'complete';
  };

  return (
    <div className="flex gap-6 py-8">
      {columns.map(col => (
        <div
          key={col.id}
          className={`flex-1 bg-gradient-to-br from-white to-${col.color}-50 rounded-2xl shadow p-4 min-h-[400px] trello-col`}
          onDragOver={e => e.preventDefault()}
          onDrop={() => onDrop(col.id)}
        >
          <h2 className={`text-xl font-bold mb-4 text-center text-${col.color}-700 flex items-center justify-center gap-2`}>
            {col.id === 'tasks' && <Calendar className="h-5 w-5" />} 
            {col.id === 'done' && <CheckCircle className="h-5 w-5" />} 
            {col.id === 'complete' && <User className="h-5 w-5" />} 
            {col.title}
          </h2>
          <button className={`mb-4 btn-primary w-full bg-${col.color}-600 hover:bg-${col.color}-700`} onClick={() => openModal({ status: col.id })}>+ Add Task</button>
          <div className="space-y-4">
            {tasks.filter(t => t.status === col.id).map(task => (
              <div
                key={task._id}
                className={`bg-white rounded-xl shadow p-4 cursor-move border-l-4 border-${col.color}-400 hover:shadow-lg transition trello-card relative`}
                draggable
                onDragStart={() => onDragStart(task)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Avatar user={task.assignedTo} size={28} />
                  <span className="font-semibold text-lg">{task.title}</span>
                  {isOverdue(task) && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Overdue</span>}
                  <button className="ml-auto flex items-center gap-1 text-gray-400 hover:text-blue-500" onClick={() => openModal(task)} title="Comments">
                    <MessageCircle className="h-4 w-4" />
                    {task.comments?.length > 0 && <span className="text-xs font-bold">{task.comments.length}</span>}
                  </button>
                </div>
                <div className="text-gray-600 text-sm mb-2">{task.description}</div>
                {task.notes && (
                  <div className="flex items-center text-xs text-gray-500 mb-2"><StickyNote className="h-4 w-4 mr-1" /> {task.notes}</div>
                )}
                <div className="flex items-center text-xs text-gray-400 mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  {task.due ? formatDateTime(task.due) : 'No deadline'}
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="btn-secondary btn-xs" onClick={() => openModal(task)}>Edit</button>
                  <button className="btn-danger btn-xs" onClick={() => handleDelete(task._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{modalTask && modalTask._id ? 'Edit Task' : 'Add Task'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input name="title" defaultValue={modalTask?.title || ''} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea name="description" defaultValue={modalTask?.description || ''} className="input-field w-full" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium">Due Date</label>
                  <input name="due" type="date" defaultValue={modalTask?.due ? modalTask.due.slice(0,10) : ''} className="input-field w-full" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">Due Time</label>
                  <input name="dueTime" type="time" defaultValue={modalTask?.due ? new Date(modalTask.due).toISOString().slice(11,16) : ''} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea name="notes" defaultValue={modalTask?.notes || ''} className="input-field w-full" rows={2} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
              </div>
            </form>
            {modalTask && modalTask._id && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Comments</h4>
                <CommentsSection task={modalTask} employee={employee} refreshTask={fetchTasks} />
              </div>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{error}</div>
      )}
    </div>
  );
};

function CommentsSection({ task, employee, refreshTask }) {
  const [comments, setComments] = useState(task.comments || []);
  const [text, setText] = useState('');
  useEffect(() => { setComments(task.comments || []); }, [task]);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await tasksAPI.addComment(task._id, { text });
      setComments([...comments, data]);
      setText('');
      refreshTask();
    } catch {}
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await tasksAPI.deleteComment(task._id, id);
      setComments(comments.filter(c => c._id !== id));
      refreshTask();
    } catch {}
  };
  return (
    <div>
      <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
        {comments.length === 0 && <div className="text-gray-400 text-sm">No comments yet.</div>}
        {comments.map(c => (
          <div key={c._id} className="flex items-start gap-2 bg-gray-50 rounded p-2">
            <Avatar user={c.author} size={24} />
            <div className="flex-1">
              <div className="text-xs font-bold">{c.author?.name || 'User'} <span className="text-gray-400 font-normal">{new Date(c.createdAt).toLocaleString()}</span></div>
              <div className="text-sm">{c.text}</div>
            </div>
            {(employee._id === c.author?._id) && (
              <button className="text-xs text-red-400 hover:text-red-600 ml-2" onClick={() => handleDelete(c._id)}>Delete</button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mt-2">
        <input className="input-field flex-1" value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment..." />
        <button className="btn-primary" type="submit">Post</button>
      </form>
    </div>
  );
}

export default TasksBoard; 
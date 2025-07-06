import React, { useState, useEffect } from 'react';
import { shiftAPI, employeeAPI } from '../services/api';
import { 
  Clock, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserPlus,
  UserMinus,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';

const ShiftsTab = () => {
  const [shifts, setShifts] = useState([]);

  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedShift, setSelectedShift] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    workingHours: 8,
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    color: '#3B82F6',
    isActive: true
  });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assignmentType, setAssignmentType] = useState('assign');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading shifts data...');
      const [shiftsRes, employeesRes, unassignedRes] = await Promise.all([
        shiftAPI.getAll(),
        employeeAPI.getAll(),
        shiftAPI.getUnassignedEmployees()
      ]);
      
      console.log('Shifts response:', shiftsRes.data);
      console.log('Employees response:', employeesRes.data);
      console.log('Unassigned employees response:', unassignedRes.data);
      
      setShifts(shiftsRes.data);
      setEmployees(employeesRes.data);
      setUnassignedEmployees(unassignedRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error loading data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'daysOfWeek') {
        const updatedDays = checked
          ? [...formData.daysOfWeek, value]
          : formData.daysOfWeek.filter(day => day !== value);
        setFormData({ ...formData, daysOfWeek: updatedDays });
      } else {
        setFormData({ ...formData, [name]: checked });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const openModal = (type, shift = null) => {
    setModalType(type);
    setSelectedShift(shift);
    if (type === 'edit' && shift) {
      setFormData({
        name: shift.name,
        description: shift.description,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workingHours: shift.workingHours,
        daysOfWeek: shift.daysOfWeek,
        color: shift.color,
        isActive: shift.isActive
      });
    } else {
      setFormData({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        workingHours: 8,
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        color: '#3B82F6',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedShift(null);
    setFormData({
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      workingHours: 8,
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      color: '#3B82F6',
      isActive: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Sending formData:', formData);
      if (modalType === 'add') {
        await shiftAPI.create(formData);
      } else {
        await shiftAPI.update(selectedShift._id, formData);
      }
      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving shift:', error);
      // Show the actual error message from the backend
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Error saving shift: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      setLoading(true);
      try {
        await shiftAPI.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting shift:', error);
        // Show the actual error message from the backend
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
        alert(`Error deleting shift: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const openAssignmentModal = (shift, type) => {
    setSelectedShift(shift);
    setAssignmentType(type);
    setSelectedEmployees([]);
    setShowAssignmentModal(true);
  };

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setSelectedShift(null);
    setSelectedEmployees([]);
  };

  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleAssignment = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    setLoading(true);
    try {
      if (assignmentType === 'assign') {
        await shiftAPI.assignEmployees(selectedShift._id, selectedEmployees);
      } else {
        await shiftAPI.unassignEmployees(selectedShift._id, selectedEmployees);
      }
      closeAssignmentModal();
      loadData();
    } catch (error) {
      console.error('Error managing assignments:', error);
      // Show the actual error message from the backend
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Error managing assignments: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = shifts.filter(shift =>
    shift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (shift) => {
    if (!shift.isActive) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (shift.daysOfWeek.includes(currentDay) && 
        currentTime >= shift.startTime && 
        currentTime <= shift.endTime) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = (shift) => {
    if (!shift.isActive) return 'Inactive';
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (shift.daysOfWeek.includes(currentDay) && 
        currentTime >= shift.startTime && 
        currentTime <= shift.endTime) {
      return 'Active Now';
    }
    
    return 'Scheduled';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
          <p className="text-gray-600">Create and manage work shifts for employees</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Shift
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search shifts by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShifts.map((shift) => (
          <div key={shift._id} className="bg-white rounded-lg shadow-md p-6 border-l-4" 
               style={{ borderLeftColor: shift.color }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {getStatusIcon(shift)}
                <div className="ml-2">
                  <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                  <p className="text-sm text-gray-500">{getStatusText(shift)}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => openAssignmentModal(shift, 'assign')}
                  className="text-primary-600 hover:text-primary-900 p-1"
                  title="Assign Employees"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openAssignmentModal(shift, 'unassign')}
                  className="text-warning-600 hover:text-warning-900 p-1"
                  title="Unassign Employees"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openModal('edit', shift)}
                  className="text-primary-600 hover:text-primary-900 p-1"
                  title="Edit Shift"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(shift._id)}
                  className="text-red-600 hover:text-red-900 p-1"
                  title="Delete Shift"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {shift.description && (
              <p className="text-sm text-gray-600 mb-3">{shift.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-900">{shift.startTime} - {shift.endTime}</span>
                <span className="text-gray-500 ml-2">({shift.workingHours}h)</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-900">{shift.daysOfWeek.join(', ')}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-900">
                  {shift.assignedEmployees.length} employee{shift.assignedEmployees.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Assigned Employees Preview */}
            {shift.assignedEmployees.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Assigned Employees:</p>
                <div className="flex flex-wrap gap-1">
                  {shift.assignedEmployees.slice(0, 3).map((assignment) => (
                    <div key={assignment.employeeId?._id || Math.random()} className="flex items-center">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {assignment.employeeId && assignment.employeeId.profilePicture ? (
                          <img 
                            src={`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/api/employees/profile-picture/${assignment.employeeId._id}`}
                            alt={assignment.employeeId.name}
                            className="w-6 h-6 object-cover"
                          />
                        ) : assignment.employeeId && assignment.employeeId.name ? (
                          <span className="text-xs font-medium text-gray-600">
                            {assignment.employeeId.name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">?</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {shift.assignedEmployees.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{shift.assignedEmployees.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Shift Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {modalType === 'add' ? 'Add New Shift' : 'Edit Shift'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shift Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <div className="flex space-x-2 mt-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="input-field"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Working Hours</label>
                  <input
                    type="number"
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleInputChange}
                    className="input-field"
                    min="0.5"
                    max="24"
                    step="0.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                  <div className="grid grid-cols-2 gap-2">
                    {daysOfWeek.map((day) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          name="daysOfWeek"
                          value={day}
                          checked={formData.daysOfWeek.includes(day)}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : (modalType === 'add' ? 'Add Shift' : 'Update Shift')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay" onClick={closeAssignmentModal}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {assignmentType === 'assign' ? 'Assign Employees' : 'Unassign Employees'} - {selectedShift?.name}
            </h3>
            
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto">
                {(assignmentType === 'assign' ? unassignedEmployees : selectedShift?.assignedEmployees.map(a => a.employeeId)).map((employee) => (
                  <label key={employee._id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee._id)}
                      onChange={() => handleEmployeeSelection(employee._id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {employee.profilePicture ? (
                          <img 
                            src={`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/api/employees/profile-picture/${employee._id}`}
                            alt={employee.name}
                            className="w-8 h-8 object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAssignmentModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignment}
                  disabled={loading || selectedEmployees.length === 0}
                  className="btn-primary"
                >
                  {loading ? 'Processing...' : (assignmentType === 'assign' ? 'Assign Selected' : 'Unassign Selected')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftsTab; 
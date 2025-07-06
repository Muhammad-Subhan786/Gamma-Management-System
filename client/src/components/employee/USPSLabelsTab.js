import React, { useState, useEffect } from 'react';
import { uspsLabelsAPI, uspsGoalsAPI } from '../../services/api';
import { Plus, Edit, Trash2, Upload, DollarSign, Mail, User, FileImage, XCircle, Target, Users, BarChart3 } from 'lucide-react';
import GoalMeter from './GoalMeter';

const initialForm = {
  customerName: '',
  customerEmail: '',
  totalLabels: '',
  rate: '',
  paidLabels: '',
  notes: '',
  status: 'pending',
  paymentScreenshots: [],
  entryDate: new Date().toISOString().slice(0, 10),
};

const initialGoalForm = {
  targetLabels: '',
  targetRevenue: ''
};

const USPSLabelsTab = ({ employee }) => {
  const [dashboard, setDashboard] = useState({ totalLabels: 0, averageRate: 0, totalRevenue: 0 });
  const [labels, setLabels] = useState([]);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [goalForm, setGoalForm] = useState(initialGoalForm);
  const [editId, setEditId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('labels');

  useEffect(() => {
    loadDashboard();
    loadLabels();
    loadCurrentGoal();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await uspsLabelsAPI.getMyDashboard();
      setDashboard(data);
    } catch {}
  };
  
  const loadLabels = async () => {
    setLoading(true);
    try {
      const { data } = await uspsLabelsAPI.getMyLabels();
      setLabels(data);
    } catch {}
    setLoading(false);
  };

  const loadCurrentGoal = async () => {
    try {
      const { data } = await uspsGoalsAPI.getCurrentGoal();
      setCurrentGoal(data);
    } catch {}
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleGoalInput = (e) => {
    const { name, value } = e.target;
    setGoalForm(f => ({ ...f, [name]: value }));
  };

  const handleFile = (e) => {
    setUploadFiles([...e.target.files]);
  };

  const openAdd = () => {
    setForm({ ...initialForm, entryDate: new Date().toISOString().slice(0, 10) });
    setEditId(null);
    setUploadFiles([]);
    setShowForm(true);
  };

  const openEdit = (label) => {
    setForm({ ...label, paymentScreenshots: [], entryDate: label.createdAt ? label.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10) });
    setEditId(label._id);
    setUploadFiles([]);
    setShowForm(true);
  };

  const openGoalEdit = () => {
    setGoalForm({
      targetLabels: currentGoal?.targetLabels || '',
      targetRevenue: currentGoal?.targetRevenue || ''
    });
    setShowGoalForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(initialForm);
    setEditId(null);
    setUploadFiles([]);
  };

  const closeGoalForm = () => {
    setShowGoalForm(false);
    setGoalForm(initialGoalForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'paymentScreenshots') formData.append(k, v);
      });
      uploadFiles.forEach(f => formData.append('paymentScreenshots', f));
      
      if (editId) {
        await uspsLabelsAPI.updateLabel(editId, formData);
        alert('Label updated successfully!');
      } else {
        await uspsLabelsAPI.addLabel(formData);
        alert('Label added successfully!');
      }
      closeForm();
      loadLabels();
      loadDashboard();
      loadCurrentGoal(); // Refresh goal progress
    } catch (err) {
      console.error('Error saving label:', err);
      alert(err.response?.data?.error || 'Error saving label. Please try again.');
    }
    setLoading(false);
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await uspsGoalsAPI.updateCurrentGoal(goalForm);
      alert('Goal updated successfully!');
      closeGoalForm();
      loadCurrentGoal();
    } catch (err) {
      console.error('Error updating goal:', err);
      alert(err.response?.data?.error || 'Error updating goal. Please try again.');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this label?')) return;
    setLoading(true);
    try {
      await uspsLabelsAPI.deleteLabel(id);
      loadLabels();
      loadDashboard();
      loadCurrentGoal(); // Refresh goal progress
    } catch {
      alert('Error deleting label');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'labels' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setActiveTab('labels')}
        >
          My Labels
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'goal' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-green-600'}`}
          onClick={() => setActiveTab('goal')}
        >
          Monthly Goal
        </button>
      </div>

      {/* My Labels Tab */}
      {activeTab === 'labels' && (
        <>
          {/* Quick Stats - Modern Card Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="flex items-center p-5 bg-gradient-to-br from-blue-100 to-blue-300 rounded-2xl shadow-md">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{dashboard.totalLabels.toLocaleString()}</div>
                <div className="text-sm text-blue-800 font-medium">Total Labels</div>
              </div>
            </div>
            <div className="flex items-center p-5 bg-gradient-to-br from-green-100 to-green-300 rounded-2xl shadow-md">
              <DollarSign className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-green-700">${dashboard.averageRate?.toFixed(2)}</div>
                <div className="text-sm text-green-800 font-medium">Average Rate</div>
              </div>
            </div>
            <div className="flex items-center p-5 bg-gradient-to-br from-purple-100 to-purple-300 rounded-2xl shadow-md">
              <DollarSign className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-purple-700">${dashboard.totalRevenue?.toFixed(2)}</div>
                <div className="text-sm text-purple-800 font-medium">Total Revenue</div>
              </div>
            </div>
            <div className="flex items-center p-5 bg-gradient-to-br from-yellow-100 to-yellow-300 rounded-2xl shadow-md">
              <Users className="h-8 w-8 text-yellow-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-yellow-700">{dashboard.totalCustomers}</div>
                <div className="text-sm text-yellow-800 font-medium">Total Customers</div>
              </div>
            </div>
          </div>

          {/* Labels List and Add/Edit Forms (existing code) */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">My USPS Labels</h2>
            <button className="btn-primary flex items-center" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add Label
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-center">Total</th>
                  <th className="p-2 text-center">Rate</th>
                  <th className="p-2 text-center">Paid</th>
                  <th className="p-2 text-center">Revenue</th>
                  <th className="p-2 text-center">Screenshots</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {labels.map(label => (
                  <tr key={label._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{label.customerName}</td>
                    <td className="p-2">{label.customerEmail}</td>
                    <td className="p-2 text-center">{label.totalLabels}</td>
                    <td className="p-2 text-center">${Number(label.rate).toFixed(2)}</td>
                    <td className="p-2 text-center">{label.paidLabels}</td>
                    <td className="p-2 text-center">${Number(label.totalRevenue).toFixed(2)}</td>
                    <td className="p-2 text-center">
                      <div className="flex flex-wrap gap-1">
                        {label.paymentScreenshots?.map((s, i) => (
                          <a key={i} href={uspsLabelsAPI.getPaymentScreenshot(s.filename)} target="_blank" rel="noopener noreferrer" className="inline-block">
                            <FileImage className="h-5 w-5 text-blue-500" />
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 text-center capitalize">{label.status}</td>
                    <td className="p-2 text-center">
                      <button className="text-primary-600 hover:text-primary-900 mr-2" onClick={() => openEdit(label)}><Edit className="h-4 w-4" /></button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(label._id)}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {labels.length === 0 && (
                  <tr><td colSpan={9} className="text-center p-4 text-gray-400">No labels found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Monthly Goal Tab */}
      {activeTab === 'goal' && (
        <div className="space-y-8">
          <GoalMeter 
            goal={currentGoal} 
            title="Monthly Goal" 
            showEdit={true} 
            onEdit={openGoalEdit}
          />
          {/* Goal Edit Form */}
          {showGoalForm && (
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Monthly Goal</h3>
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Labels</label>
                  <input
                    type="number"
                    name="targetLabels"
                    value={goalForm.targetLabels}
                    onChange={handleGoalInput}
                    className="input-field w-full"
                    min="1"
                    placeholder="Enter target number of labels"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Revenue ($)</label>
                  <input
                    type="number"
                    name="targetRevenue"
                    value={goalForm.targetRevenue}
                    onChange={handleGoalInput}
                    className="input-field w-full"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter target revenue amount"
                    required
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 flex items-center justify-center" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" /> 
                        Update Goal
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary flex-1" 
                    onClick={closeGoalForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editId ? 'Edit Label' : 'Add New Label'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  name="customerName"
                  type="text"
                  value={form.customerName}
                  onChange={handleInput}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Email</label>
                <input
                  name="customerEmail"
                  type="email"
                  value={form.customerEmail}
                  onChange={handleInput}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Labels</label>
                <input
                  name="totalLabels"
                  type="number"
                  value={form.totalLabels}
                  onChange={handleInput}
                  className="input-field w-full"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rate ($)</label>
                <input
                  name="rate"
                  type="number"
                  value={form.rate}
                  onChange={handleInput}
                  className="input-field w-full"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Paid Labels</label>
                <input
                  name="paidLabels"
                  type="number"
                  value={form.paidLabels}
                  onChange={handleInput}
                  className="input-field w-full"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={form.status || 'pending'}
                  onChange={handleInput}
                  className="input-field w-full"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Entry Date</label>
                <input
                  name="entryDate"
                  type="date"
                  value={form.entryDate}
                  onChange={handleInput}
                  className="input-field w-full"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInput}
                className="input-field w-full"
                rows="3"
                placeholder="Additional notes about this label..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Screenshots</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFile}
                className="input-field w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload payment screenshots (JPG, PNG, PDF up to 5MB each)
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button 
                type="submit" 
                className="btn-primary flex-1 flex items-center justify-center" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editId ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    {editId ? 'Update Label' : 'Add Label'}
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn-secondary flex-1" 
                onClick={closeForm}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default USPSLabelsTab; 
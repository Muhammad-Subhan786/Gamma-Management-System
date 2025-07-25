import React, { useState, useEffect, useRef } from 'react';
import { uspsLabelsAPI, uspsGoalsAPI } from '../../services/api';
import { Plus, Edit, Trash2, DollarSign, User, FileImage, Target, Users, BarChart3, Save, X, AlertTriangle, Calendar } from 'lucide-react';
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
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [goalForm, setGoalForm] = useState(initialGoalForm);
  const [editId, setEditId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('labels');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [error, setError] = useState('');

  // Refs for form navigation
  const emailRef = useRef();
  const totalLabelsRef = useRef();
  const rateRef = useRef();
  const paidLabelsRef = useRef();
  const statusRef = useRef();
  const entryDateRef = useRef();
  const notesRef = useRef();

  // Move loadDashboard inside the component
  const loadDashboard = async () => {
    try {
      const { data } = await uspsLabelsAPI.getMyDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      }
    }
  };

  useEffect(() => {
    loadDashboard();
    loadLabels();
    loadCurrentGoal();
    // Debug authentication
    debugAuth();
  }, []);

  const debugAuth = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      console.log('Debug - Token in localStorage:', token ? 'Present' : 'Missing');
      console.log('Debug - Token value:', token);
      
      if (!token) {
        console.log('Debug - No token found in localStorage');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/api/usps-labels/debug-auth`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Debug - Auth test response:', data);
    } catch (error) {
      console.log('Debug - Auth test error:', error);
    }
  };
  
  const loadLabels = async () => {
    setLoading(true);
    try {
      const { data } = await uspsLabelsAPI.getMyLabels();
      setLabels(data);
    } catch (error) {
      console.error('Error loading labels:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      }
    }
    setLoading(false);
  };

  const loadCurrentGoal = async () => {
    try {
      const { data } = await uspsGoalsAPI.getCurrentGoal();
      setCurrentGoal(data);
    } catch (error) {
      console.error('Error loading goal:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      }
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleGoalInput = (e) => {
    const { name, value } = e.target;
    setGoalForm(f => ({ ...f, [name]: value }));
  };



  const openAdd = () => {
    setForm({ ...initialForm, entryDate: new Date().toISOString().slice(0, 10) });
    setEditId(null);
    setUploadFiles([]);
    setError('');
  };

  const openEdit = (label) => {
    setForm({ ...label, paymentScreenshots: [], entryDate: label.createdAt ? label.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10) });
    setEditId(label._id);
    setUploadFiles([]);
    setError('');
  };

  const openGoalEdit = () => {
    setGoalForm({
      targetLabels: currentGoal?.targetLabels || '',
      targetRevenue: currentGoal?.targetRevenue || ''
    });
    setShowGoalForm(true);
  };

  const closeForm = () => {
    setForm(initialForm);
    setEditId(null);
    setUploadFiles([]);
    setError('');
  };

  const closeGoalForm = () => {
    setShowGoalForm(false);
    setGoalForm(initialGoalForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if employee token exists
    const employeeToken = localStorage.getItem('employeeToken');
    if (!employeeToken) {
      setError('Authentication required. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    
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
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(err.response?.data?.error || 'Error saving label. Please try again.');
      }
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
    } catch (error) {
      console.error('Error deleting label:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        alert('Error deleting label');
      }
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
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'finance' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
          onClick={() => setActiveTab('finance')}
        >
          Finance
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

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

          {/* Add Label Form - Horizontal Layout like AuraNest */}
          <div className="w-full">
            <form onSubmit={handleSubmit} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-4 flex flex-col md:flex-row md:items-end gap-4 mb-4">
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleInput}
                placeholder="Customer Name"
                className="input-field flex-1"
                required
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); emailRef.current && emailRef.current.focus(); } }}
              />
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleInput}
                placeholder="Customer Email"
                className="input-field flex-1"
                required
                ref={emailRef}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); totalLabelsRef.current && totalLabelsRef.current.focus(); } }}
              />
              <input
                type="number"
                name="totalLabels"
                value={form.totalLabels}
                onChange={handleInput}
                placeholder="Total Labels"
                className="input-field flex-1"
                min="1"
                required
                ref={totalLabelsRef}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); rateRef.current && rateRef.current.focus(); } }}
              />
              <input
                type="number"
                name="rate"
                value={form.rate}
                onChange={handleInput}
                placeholder="Rate ($)"
                className="input-field flex-1"
                min="0.01"
                step="0.01"
                required
                ref={rateRef}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); paidLabelsRef.current && paidLabelsRef.current.focus(); } }}
              />
              <input
                type="number"
                name="paidLabels"
                value={form.paidLabels}
                onChange={handleInput}
                placeholder="Paid Labels"
                className="input-field flex-1"
                min="0"
                required
                ref={paidLabelsRef}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); statusRef.current && statusRef.current.focus(); } }}
              />
              <select
                name="status"
                value={form.status || 'pending'}
                onChange={handleInput}
                className="input-field flex-1"
                required
                ref={statusRef}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); entryDateRef.current && entryDateRef.current.focus(); } }}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
              </select>
              <input
                type="date"
                name="entryDate"
                value={form.entryDate}
                onChange={handleInput}
                className="input-field flex-1"
                required
                ref={entryDateRef}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); notesRef.current && notesRef.current.focus(); } }}
              />
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleInput}
                placeholder="Notes"
                className="input-field flex-1"
                ref={notesRef}
              />
              <div className="flex flex-col gap-2 md:flex-row md:gap-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </button>
                <button type="button" onClick={closeForm} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center" disabled={loading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Labels List */}
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
            showEdit={false} 
          />
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="space-y-8">
          {/* If there is a salaries filter or subtab, wrap the filter controls in a glassmorphism card with soft shadow, rounded corners, and icons. Use modern input styles and color accents. Example: */}
          {/* <div className="backdrop-blur-md bg-white/60 border border-purple-200 rounded-2xl shadow-lg p-4 flex flex-col md:flex-row md:items-end gap-4 mb-4 transition-all duration-200"> */}
          {/*   <label className="font-medium flex items-center gap-2"> */}
          {/*     <Calendar className="h-5 w-5 text-purple-500" /> Month: */}
          {/*     <input ... /> */}
          {/*   </label> */}
          {/*   ... */}
          {/* </div> */}
          <div className="backdrop-blur-md bg-white/60 border border-purple-200 rounded-2xl shadow-lg p-4 flex flex-col md:flex-row md:items-end gap-4 mb-4 transition-all duration-200">
            <label className="font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" /> Month:
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="ml-2 border rounded px-2 py-1"
              />
            </label>
          </div>
          {/* Salary Calculation */}
          {(() => {
            // Filter labels for selected month
            const [year, month] = selectedMonth.split('-');
            const monthLabels = labels.filter(label => {
              const d = new Date(label.entryDate || label.createdAt);
              return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
            });
            // Group by client (customerEmail)
            const clientMap = {};
            labels.forEach(label => {
              const email = label.customerEmail;
              if (!clientMap[email]) clientMap[email] = [];
              clientMap[email].push(label);
            });
            // For each client, find their first month
            const clientFirstMonth = {};
            Object.entries(clientMap).forEach(([email, arr]) => {
              const first = arr.reduce((min, l) => {
                const d = new Date(l.entryDate || l.createdAt);
                return (!min || d < min) ? d : min;
              }, null);
              clientFirstMonth[email] = first ? `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}` : null;
            });
            // For selected month, for each client, sum paid labels in that month
            const clientStats = Object.entries(clientMap).map(([email, arr]) => {
              const monthArr = arr.filter(l => {
                const d = new Date(l.entryDate || l.createdAt);
                return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
              });
              const paidLabels = monthArr.reduce((sum, l) => sum + Number(l.paidLabels || 0), 0);
              const totalLabels = monthArr.reduce((sum, l) => sum + Number(l.totalLabels || 0), 0);
              const clientName = monthArr[0]?.customerName || email;
              // Only first month counts for bonus
              const qualifies = clientFirstMonth[email] === selectedMonth && paidLabels >= 100;
              return { email, clientName, paidLabels, totalLabels, qualifies };
            });
            // Calculate bonus
            const baseSalary = 10000;
            const bonusClients = clientStats.filter(c => c.qualifies);
            const bonus = bonusClients.length * 2000;
            const totalSalary = baseSalary + bonus;
            return (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-purple-700">Salary Breakdown for {selectedMonth}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                    <div className="text-lg font-semibold text-blue-700">Base Salary</div>
                    <div className="text-2xl font-bold text-blue-900">10,000 PKR</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                    <div className="text-lg font-semibold text-green-700">Performance Bonus</div>
                    <div className="text-2xl font-bold text-green-900">{bonus.toLocaleString()} PKR</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
                    <div className="text-lg font-semibold text-purple-700">Total Salary</div>
                    <div className="text-2xl font-bold text-purple-900">{totalSalary.toLocaleString()} PKR</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Bonus-Qualifying Clients</h3>
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Client</th>
                      <th className="p-2 text-center">Paid Labels</th>
                      <th className="p-2 text-center">Qualified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientStats.map(c => (
                      <tr key={c.email} className={c.qualifies ? 'bg-green-50' : ''}>
                        <td className="p-2">{c.clientName}</td>
                        <td className="p-2 text-center">{c.paidLabels}</td>
                        <td className="p-2 text-center font-bold">{c.qualifies ? 'Yes (+2,000 PKR)' : '-'}</td>
                      </tr>
                    ))}
                    {clientStats.length === 0 && (
                      <tr><td colSpan={3} className="text-center p-4 text-gray-400">No sales for this month.</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-4 text-gray-600 text-sm">
                  <p>Bonus is awarded for each client with at least 100 paid labels in their first month of sales. Only the first month counts for bonus. No carry-forward.</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default USPSLabelsTab; 
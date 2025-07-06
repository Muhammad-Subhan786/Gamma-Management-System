import React, { useState, useEffect } from 'react';
import { uspsLabelsAPI, uspsGoalsAPI } from '../services/api';
import { Edit, Trash2, DollarSign, User, Loader2, Target, Trophy, TrendingUp, Calendar, Plus, XCircle, Lock, Unlock, Save as SaveIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DateTime } from 'luxon';

const USPSLabelsTabAdmin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState({ totalLabels: 0, averageRate: 0, totalRevenue: 0 });
  const [labels, setLabels] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [goals, setGoals] = useState([]);
  const [goalAnalytics, setGoalAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({
    employeeId: '',
    month: new Date().toISOString().slice(0, 7),
    targetLabels: '',
    targetRevenue: '',
    deadline: ''
  });
  const [editGoalId, setEditGoalId] = useState(null);
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeesLoading, setEmployeesLoading] = useState(false);
  // Add error state for employees
  const [employeesError, setEmployeesError] = useState('');
  const [profitMonth, setProfitMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [costPerLabel, setCostPerLabel] = useState(() => {
    const saved = localStorage.getItem('usps_cost_per_label_' + profitMonth);
    return saved ? Number(saved) : 0.10;
  });
  const [costLocked, setCostLocked] = useState(true);
  const [costInput, setCostInput] = useState(costPerLabel);

  const [finalMonth, setFinalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [finalInputs, setFinalInputs] = useState(() => {
    const saved = localStorage.getItem('usps_final_expenses_' + finalMonth);
    return saved ? JSON.parse(saved) : {
      office: 0,
      internet: 0,
      ads: 0,
      acquisition: 0
    };
  });
  const [finalLocked, setFinalLocked] = useState(true);
  const [finalInputDraft, setFinalInputDraft] = useState(finalInputs);

  useEffect(() => {
    loadDashboard();
    loadLabels();
    loadEmployees();
    loadGoals();
    loadGoalAnalytics();
  }, []);

  // Add useEffect to reload dashboard and employees on tab switch
  useEffect(() => {
    if (activeTab === 'salaries' || activeTab === 'goals') {
      loadEmployees();
    }
    if (activeTab === 'overview') {
      loadDashboard();
    }
  }, [activeTab]);

  // When profitMonth changes, load cost from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('usps_cost_per_label_' + profitMonth);
    setCostPerLabel(saved ? Number(saved) : 0.10);
    setCostInput(saved ? Number(saved) : 0.10);
    setCostLocked(true);
  }, [profitMonth]);

  // When finalMonth changes, load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('usps_final_expenses_' + finalMonth);
    const val = saved ? JSON.parse(saved) : {
      office: 0,
      internet: 0,
      ads: 0,
      acquisition: 0
    };
    setFinalInputs(val);
    setFinalInputDraft(val);
    setFinalLocked(true);
  }, [finalMonth]);

  const loadDashboard = async () => {
    try {
      const { data } = await uspsLabelsAPI.getAdminDashboard();
      setDashboard(data || { totalLabels: 0, averageRate: 0, totalRevenue: 0 });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboard({ totalLabels: 0, averageRate: 0, totalRevenue: 0 });
    }
  };

  const loadLabels = async () => {
    setLoading(true);
    try {
      const { data } = await uspsLabelsAPI.getAll();
      setLabels(data || []);
    } catch (error) {
      console.error('Error loading labels:', error);
      setLabels([]);
    }
    setLoading(false);
  };

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    setEmployeesError('');
    try {
      const response = await fetch('/api/employees');
      const { data } = await response.json();
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
      setEmployeesError('Failed to load employees.');
    }
    setEmployeesLoading(false);
  };

  const loadGoals = async () => {
    try {
      const { data } = await uspsGoalsAPI.getAdminCurrent();
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    }
  };

  const loadGoalAnalytics = async () => {
    try {
      const { data } = await uspsGoalsAPI.getAdminAnalytics();
      setGoalAnalytics(data || {});
    } catch (error) {
      console.error('Error loading goal analytics:', error);
      setGoalAnalytics({});
    }
  };

  const openGoalAdd = () => {
    setGoalForm({
      employeeId: '',
      month: new Date().toISOString().slice(0, 7),
      targetLabels: '',
      targetRevenue: '',
      deadline: ''
    });
    setEditGoalId(null);
    setShowGoalForm(true);
  };

  const closeGoalForm = () => {
    setShowGoalForm(false);
    setGoalForm({
      employeeId: '',
      month: new Date().toISOString().slice(0, 7),
      targetLabels: '',
      targetRevenue: '',
      deadline: ''
    });
    setEditGoalId(null);
  };

  const handleGoalInput = (e) => {
    const { name, value } = e.target;
    setGoalForm(f => ({ ...f, [name]: value }));
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editGoalId) {
        await uspsGoalsAPI.updateAdminGoal(editGoalId, goalForm);
      } else {
        await uspsGoalsAPI.setEmployeeGoal(goalForm.employeeId, goalForm);
      }
      closeGoalForm();
      loadGoals();
      loadGoalAnalytics();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Error saving goal');
    }
    setLoading(false);
  };

  const getChartData = () => {
    if (!labels || labels.length === 0) return [];
    
    const employeeStats = {};
    labels.forEach(label => {
      const employeeName = label.employeeId?.name || 'Unknown';
      if (!employeeStats[employeeName]) {
        employeeStats[employeeName] = { labels: 0, revenue: 0 };
      }
      employeeStats[employeeName].labels += parseInt(label.totalLabels) || 0;
      employeeStats[employeeName].revenue += parseFloat(label.totalRevenue) || 0;
    });

    return Object.entries(employeeStats).map(([name, stats]) => ({
      name,
      labels: stats.labels,
      revenue: stats.revenue
    })).sort((a, b) => b.labels - a.labels);
  };

  const getStatusData = () => {
    if (!labels || labels.length === 0) return [];
    
    const statusCount = {};
    labels.forEach(label => {
      const status = label.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Filtered labels
  const filteredLabels = labels.filter(label => {
    const matchesSearch =
      label.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      label.customerEmail?.toLowerCase().includes(search.toLowerCase());
    const matchesEmployee = employeeFilter ? (label.employeeId?._id === employeeFilter) : true;
    const createdAt = label.createdAt ? DateTime.fromISO(label.createdAt) : null;
    const matchesDateFrom = dateFrom ? (createdAt && createdAt >= DateTime.fromISO(dateFrom)) : true;
    const matchesDateTo = dateTo ? (createdAt && createdAt <= DateTime.fromISO(dateTo)) : true;
    return matchesSearch && matchesEmployee && matchesDateFrom && matchesDateTo;
  });

  // Bulk actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLabels(filteredLabels.map(l => l._id));
    } else {
      setSelectedLabels([]);
    }
  };
  const handleSelectLabel = (id) => {
    setSelectedLabels(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };
  const handleBulkDelete = async () => {
    if (!window.confirm('Delete all selected labels?')) return;
    setLoading(true);
    try {
      await Promise.all(selectedLabels.map(id => uspsLabelsAPI.deleteLabel(id)));
      setSelectedLabels([]);
      loadLabels();
    } catch (err) {
      alert('Error deleting labels');
    }
    setLoading(false);
  };
  const handleBulkUpdateStatus = async (status) => {
    if (!window.confirm(`Update status of all selected labels to '${status}'?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedLabels.map(id => uspsLabelsAPI.updateLabel(id, { status })));
      setSelectedLabels([]);
      loadLabels();
    } catch (err) {
      alert('Error updating labels');
    }
    setLoading(false);
  };

  // After any label add/edit/delete, reload dashboard and employees
  // (Assume handleLabelChange is called after any label change)
  const handleLabelChange = () => {
    loadLabels();
    loadDashboard();
    loadEmployees();
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('labels')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'labels'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Labels Management
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'goals'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Goal Management
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'salaries'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-purple-600'
            }`}
          >
            Salaries
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'profit'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-green-600'
            }`}
          >
            Profit Analysis
          </button>
          <button
            onClick={() => setActiveTab('final')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'final'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-red-600'
            }`}
          >
            Final Calculations
          </button>
        </div>
        <button
          className="ml-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-md hover:scale-105 transition-transform duration-200 flex items-center"
          onClick={() => {
            loadDashboard();
            loadLabels();
            loadEmployees();
            loadGoals();
            loadGoalAnalytics();
          }}
          disabled={loading || employeesLoading}
        >
          <Loader2 className={`h-5 w-5 mr-2 animate-spin ${loading || employeesLoading ? '' : 'hidden'}`} />
          Refresh
        </button>
      </div>

      {/* Overview & Analytics Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Labels</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.totalLabels?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rate</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboard.averageRate?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboard.totalRevenue?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.totalEmployees || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top 3 Performers</h3>
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(goalAnalytics.topPerformers || []).slice(0, 3).map((performer, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50' :
                  index === 1 ? 'border-gray-300 bg-gray-50' :
                  'border-orange-300 bg-orange-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      'text-orange-600'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-500">{performer.progress?.toFixed(1) || 0}%</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{performer.name || 'Unknown'}</h4>
                  <div className="text-sm text-gray-600">
                    <p>Labels: {(performer.labels || 0).toLocaleString()}</p>
                    <p>Revenue: ${(performer.revenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {(goalAnalytics.topPerformers || []).length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-400">
                  No performance data available
                </div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Performance Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance</h3>
              {getChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="labels" fill="#8884d8" name="Labels" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No data available for chart
                </div>
              )}
            </div>

            {/* Status Distribution Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Label Status Distribution</h3>
              {getStatusData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No data available for chart
                </div>
              )}
            </div>
          </div>

          {/* Goal Progress Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{goalAnalytics.completedGoals || 0}</div>
                <div className="text-sm text-gray-600">Completed Goals</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{goalAnalytics.activeGoals || 0}</div>
                <div className="text-sm text-gray-600">Active Goals</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{goalAnalytics.overdueGoals || 0}</div>
                <div className="text-sm text-gray-600">Overdue Goals</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{(goalAnalytics.averageProgress || 0).toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Avg Progress</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Labels Management Tab */}
      {activeTab === 'labels' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by customer name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <select
                  value={employeeFilter}
                  onChange={e => setEmployeeFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="input-field"
                  placeholder="From"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="input-field"
                  placeholder="To"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  className="btn-danger"
                  disabled={selectedLabels.length === 0}
                  onClick={handleBulkDelete}
                >
                  Delete Selected
                </button>
                <button
                  className="btn-secondary"
                  disabled={selectedLabels.length === 0}
                  onClick={() => handleBulkUpdateStatus('completed')}
                >
                  Mark Completed
                </button>
                <button
                  className="btn-secondary"
                  disabled={selectedLabels.length === 0}
                  onClick={() => handleBulkUpdateStatus('paid')}
                >
                  Mark Paid
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedLabels.length === filteredLabels.length && filteredLabels.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-500">Employee</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-500">Customer</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-500">Email</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Total</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Rate</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Paid</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Revenue</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredLabels || []).map(label => (
                    <tr key={label._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLabels.includes(label._id)}
                          onChange={() => handleSelectLabel(label._id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            {label.employeeId?.profilePicture ? (
                              <img 
                                src={`/api/employees/profile-picture/${label.employeeId._id}`}
                                alt={label.employeeId.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-primary-600">
                                {label.employeeId?.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{label.employeeId?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-900">{label.customerName || ''}</td>
                      <td className="p-4 text-sm text-gray-900">{label.customerEmail || ''}</td>
                      <td className="p-4 text-center text-sm text-gray-900">{label.totalLabels || 0}</td>
                      <td className="p-4 text-center text-sm text-gray-900">${Number(label.rate || 0).toFixed(2)}</td>
                      <td className="p-4 text-center text-sm text-gray-900">{label.paidLabels || 0}</td>
                      <td className="p-4 text-center text-sm text-gray-900">${Number(label.totalRevenue || 0).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          label.status === 'completed' ? 'bg-green-100 text-green-800' :
                          label.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          label.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(label.status || 'unknown').charAt(0).toUpperCase() + (label.status || 'unknown').slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(filteredLabels || []).length === 0 && (
                    <tr><td colSpan={8} className="text-center p-8 text-gray-400">No labels found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Goal Management Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Goal Form */}
          {showGoalForm && (
            <div className="bg-white rounded-lg shadow-md p-6 max-w-xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editGoalId ? 'Edit Goal' : 'Assign New Goal'}
              </h3>
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <select 
                    name="employeeId" 
                    value={goalForm.employeeId} 
                    onChange={handleGoalInput} 
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select Employee</option>
                    {(employees || []).map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <input 
                    type="month" 
                    name="month" 
                    value={goalForm.month} 
                    onChange={handleGoalInput} 
                    className="input-field w-full"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Labels</label>
                    <input 
                      type="number" 
                      name="targetLabels" 
                      value={goalForm.targetLabels} 
                      onChange={handleGoalInput} 
                      className="input-field w-full"
                      min="1"
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
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <input 
                    type="date" 
                    name="deadline" 
                    value={goalForm.deadline} 
                    onChange={handleGoalInput} 
                    className="input-field w-full"
                  />
                </div>
                <div className="flex space-x-2 mt-4">
                  <button type="submit" className="btn-primary flex items-center" disabled={loading}>
                    <Target className="h-4 w-4 mr-2" /> {editGoalId ? 'Update' : 'Assign'} Goal
                  </button>
                  <button type="button" className="btn-secondary flex items-center" onClick={closeGoalForm}>
                    <XCircle className="h-4 w-4 mr-2" /> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Goals Table */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Employee Goals</h2>
              <button className="btn-primary flex items-center" onClick={openGoalAdd}>
                <Plus className="h-4 w-4 mr-2" /> Assign Goal
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left text-sm font-medium text-gray-500">Employee</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Month</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Target Labels</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Current Labels</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Target Revenue</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Current Revenue</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Progress</th>
                    <th className="p-4 text-center text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(goals || []).map(goal => (
                    <tr key={goal._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            {goal.employeeId?.profilePicture ? (
                              <img 
                                src={`/api/employees/profile-picture/${goal.employeeId._id}`}
                                alt={goal.employeeId.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-primary-600">
                                {goal.employeeId?.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{goal.employeeId?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm text-gray-900">
                        {goal.month ? new Date(goal.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="p-4 text-center text-sm text-gray-900">{(goal.targetLabels || 0).toLocaleString()}</td>
                      <td className="p-4 text-center text-sm text-gray-900">{(goal.currentLabels || 0).toLocaleString()}</td>
                      <td className="p-4 text-center text-sm text-gray-900">${(goal.targetRevenue || 0).toFixed(2)}</td>
                      <td className="p-4 text-center text-sm text-gray-900">${(goal.currentRevenue || 0).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (goal.overallProgress || 0) >= 100 ? 'bg-green-500' :
                              (goal.overallProgress || 0) >= 75 ? 'bg-blue-500' :
                              (goal.overallProgress || 0) >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(goal.overallProgress || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {(goal.overallProgress || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                          goal.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          goal.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {(goal.status || 'unknown').charAt(0).toUpperCase() + (goal.status || 'unknown').slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(goals || []).length === 0 && (
                    <tr><td colSpan={8} className="text-center p-8 text-gray-400">No goals found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Salaries Tab */}
      {activeTab === 'salaries' && (
        <div className="space-y-8">
          {employeesError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
              <span className="text-red-700">{employeesError}</span>
              <button onClick={loadEmployees} className="ml-4 px-3 py-1 rounded bg-red-600 text-white">Retry</button>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <label className="font-medium">Select Month:
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="ml-2 border rounded px-2 py-1"
              />
            </label>
            <label className="font-medium flex items-center">Employee:
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="ml-2 border rounded px-2 py-1 min-w-[180px]"
                disabled={employeesLoading}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
              {employeesLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin text-blue-500" />}
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
            // Group by employee
            const employeeMap = {};
            labels.forEach(label => {
              const empId = label.employeeId?._id;
              if (!empId) return;
              if (!employeeMap[empId]) employeeMap[empId] = [];
              employeeMap[empId].push(label);
            });
            // For each employee, group by client
            const salaryRows = Object.entries(employeeMap)
              .filter(([empId]) => !selectedEmployee || empId === selectedEmployee)
              .map(([empId, empLabels]) => {
                // Group by client
                const clientMap = {};
                empLabels.forEach(label => {
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
                  const clientName = monthArr[0]?.customerName || email;
                  // Only first month counts for bonus
                  const qualifies = clientFirstMonth[email] === selectedMonth && paidLabels >= 100;
                  return { email, clientName, paidLabels, qualifies };
                });
                // Calculate bonus
                const baseSalary = 10000;
                const bonusClients = clientStats.filter(c => c.qualifies);
                const bonus = bonusClients.length * 2000;
                const totalSalary = baseSalary + bonus;
                const emp = employees.find(e => e._id === empId);
                return {
                  empId,
                  empName: emp?.name || 'Unknown',
                  baseSalary,
                  bonus,
                  totalSalary,
                  clientStats
                };
              });
            // Calculate summary
            const totalPayroll = salaryRows.reduce((sum, row) => sum + row.totalSalary, 0);
            const totalBonus = salaryRows.reduce((sum, row) => sum + row.bonus, 0);
            const totalEmployees = salaryRows.length;
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center">
                    <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-lg font-semibold text-blue-700">Total Payroll</div>
                      <div className="text-2xl font-bold text-blue-900">{totalPayroll.toLocaleString()} PKR</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center">
                    <User className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-lg font-semibold text-green-700">Employees</div>
                      <div className="text-2xl font-bold text-green-900">{totalEmployees}</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center">
                    <Trophy className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <div className="text-lg font-semibold text-purple-700">Total Bonus</div>
                      <div className="text-2xl font-bold text-purple-900">{totalBonus.toLocaleString()} PKR</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-purple-700">Salary Breakdown for {selectedMonth}</h2>
                  <table className="min-w-full bg-white rounded shadow">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Employee</th>
                        <th className="p-2 text-center">Base Salary</th>
                        <th className="p-2 text-center">Bonus</th>
                        <th className="p-2 text-center">Total Salary</th>
                        <th className="p-2 text-center">Bonus-Qualifying Clients</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryRows.map(row => (
                        <tr key={row.empId} className="hover:bg-blue-50">
                          <td className="p-2 font-semibold flex items-center">
                            {row.empId && employees.find(e => e._id === row.empId)?.profilePicture ? (
                              <img
                                src={`/api/employees/profile-picture/${row.empId}`}
                                alt={row.empName}
                                className="w-8 h-8 rounded-full object-cover mr-2"
                              />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center mr-2 text-blue-700 font-bold">
                                {row.empName?.charAt(0) || '?'}
                              </span>
                            )}
                            {row.empName}
                          </td>
                          <td className="p-2 text-center">10,000 PKR</td>
                          <td className="p-2 text-center">{row.bonus.toLocaleString()} PKR</td>
                          <td className="p-2 text-center font-bold">{row.totalSalary.toLocaleString()} PKR</td>
                          <td className="p-2">
                            <ul className="list-disc pl-4">
                              {row.clientStats.map(c => (
                                <li key={c.email} className={c.qualifies ? 'text-green-700 font-bold' : ''}>
                                  {c.clientName}: {c.paidLabels} paid labels {c.qualifies ? '(+2,000 PKR)' : ''}
                                </li>
                              ))}
                              {row.clientStats.length === 0 && (
                                <li className="text-gray-400">No sales for this month.</li>
                              )}
                            </ul>
                          </td>
                        </tr>
                      ))}
                      {salaryRows.length === 0 && (
                        <tr><td colSpan={5} className="text-center p-4 text-gray-400">No salary data for this month.</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="mt-4 text-gray-600 text-sm">
                    <p>Bonus is awarded for each client with at least 100 paid labels in their first month of sales. Only the first month counts for bonus. No carry-forward.</p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Profit Analysis Tab */}
      {activeTab === 'profit' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <label className="font-medium">Select Month:
              <input
                type="month"
                value={profitMonth}
                onChange={e => setProfitMonth(e.target.value)}
                className="ml-2 border rounded px-2 py-1"
              />
            </label>
            <div className="flex-1 flex items-center">
              <div className="bg-white rounded-xl shadow flex items-center px-4 py-2 transition-all duration-200 border border-green-200">
                <span className="font-medium mr-2">Cost per Label ($):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costInput}
                  onChange={e => setCostInput(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-24 mr-2 focus:ring-2 focus:ring-green-400 transition-all duration-200"
                  disabled={costLocked}
                />
                <button
                  className={`mr-2 p-1 rounded-full border ${costLocked ? 'border-gray-300 bg-gray-100' : 'border-green-400 bg-green-50'} transition-all duration-200`}
                  onClick={() => setCostLocked(l => !l)}
                  title={costLocked ? 'Unlock to edit' : 'Lock'}
                  type="button"
                >
                  {costLocked ? <Lock className="h-5 w-5 text-gray-500" /> : <Unlock className="h-5 w-5 text-green-500" />}
                </button>
                {!costLocked && (
                  <button
                    className="px-3 py-1 rounded bg-green-600 text-white flex items-center hover:bg-green-700 transition-all duration-200"
                    onClick={() => {
                      setCostPerLabel(costInput);
                      localStorage.setItem('usps_cost_per_label_' + profitMonth, costInput);
                      setCostLocked(true);
                    }}
                    type="button"
                  >
                    <SaveIcon className="h-4 w-4 mr-1" /> Save
                  </button>
                )}
              </div>
            </div>
          </div>
          {(() => {
            // Filter labels for selected month
            const [year, month] = profitMonth.split('-');
            const monthLabels = labels.filter(label => {
              const d = new Date(label.entryDate || label.createdAt);
              return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
            });
            // Group by employee
            const employeeMap = {};
            monthLabels.forEach(label => {
              const empId = label.employeeId?._id;
              if (!empId) return;
              if (!employeeMap[empId]) employeeMap[empId] = [];
              employeeMap[empId].push(label);
            });
            const profitRows = Object.entries(employeeMap).map(([empId, empLabels]) => {
              const emp = employees.find(e => e._id === empId);
              const totalLabels = empLabels.reduce((sum, l) => sum + Number(l.totalLabels || 0), 0);
              const totalRevenue = empLabels.reduce((sum, l) => sum + Number(l.totalRevenue || 0), 0);
              const avgSaleRate = totalLabels > 0 ? totalRevenue / totalLabels : 0;
              const totalCost = totalLabels * costPerLabel;
              const grossProfit = totalRevenue - totalCost;
              return {
                empId,
                empName: emp?.name || 'Unknown',
                profilePicture: emp?.profilePicture,
                totalLabels,
                totalRevenue,
                avgSaleRate,
                costPerLabel,
                totalCost,
                grossProfit
              };
            });
            const totalGrossProfit = profitRows.reduce((sum, row) => sum + row.grossProfit, 0);
            return (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-green-700">Profit Analysis for {profitMonth}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center">
                    <Trophy className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-lg font-semibold text-green-700">Total Gross Profit</div>
                      <div className="text-2xl font-bold text-green-900">${totalGrossProfit.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Employee</th>
                      <th className="p-2 text-center">Total Labels</th>
                      <th className="p-2 text-center">Total Revenue ($)</th>
                      <th className="p-2 text-center">Avg Sale Rate ($)</th>
                      <th className="p-2 text-center">Cost/Label ($)</th>
                      <th className="p-2 text-center">Total Cost ($)</th>
                      <th className="p-2 text-center">Gross Profit ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitRows.map(row => (
                      <tr key={row.empId} className="hover:bg-green-50">
                        <td className="p-2 font-semibold flex items-center">
                          {row.profilePicture ? (
                            <img
                              src={`/api/employees/profile-picture/${row.empId}`}
                              alt={row.empName}
                              className="w-8 h-8 rounded-full object-cover mr-2"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center mr-2 text-green-700 font-bold">
                              {row.empName?.charAt(0) || '?'}
                            </span>
                          )}
                          {row.empName}
                        </td>
                        <td className="p-2 text-center">{row.totalLabels}</td>
                        <td className="p-2 text-center">${row.totalRevenue.toFixed(2)}</td>
                        <td className="p-2 text-center">${row.avgSaleRate.toFixed(2)}</td>
                        <td className="p-2 text-center">${costPerLabel.toFixed(2)}</td>
                        <td className="p-2 text-center">${row.totalCost.toFixed(2)}</td>
                        <td className="p-2 text-center font-bold">${row.grossProfit.toFixed(2)}</td>
                      </tr>
                    ))}
                    {profitRows.length === 0 && (
                      <tr><td colSpan={7} className="text-center p-4 text-gray-400">No data for this month.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Final Calculations Tab */}
      {activeTab === 'final' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <label className="font-medium">Select Month:
              <input
                type="month"
                value={finalMonth}
                onChange={e => setFinalMonth(e.target.value)}
                className="ml-2 border rounded px-2 py-1"
              />
            </label>
            <div className="flex-1 flex items-center">
              <div className="bg-white rounded-xl shadow flex items-center px-4 py-2 transition-all duration-200 border border-red-200">
                <span className="font-medium mr-2">Expenses:</span>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="number"
                    min="0"
                    value={finalInputDraft.office}
                    onChange={e => setFinalInputDraft(d => ({ ...d, office: Number(e.target.value) }))}
                    className="border rounded px-2 py-1 w-28"
                    disabled={finalLocked}
                    placeholder="Office Expense"
                  />
                  <input
                    type="number"
                    min="0"
                    value={finalInputDraft.internet}
                    onChange={e => setFinalInputDraft(d => ({ ...d, internet: Number(e.target.value) }))}
                    className="border rounded px-2 py-1 w-28"
                    disabled={finalLocked}
                    placeholder="Internet Bills"
                  />
                  <input
                    type="number"
                    min="0"
                    value={finalInputDraft.ads}
                    onChange={e => setFinalInputDraft(d => ({ ...d, ads: Number(e.target.value) }))}
                    className="border rounded px-2 py-1 w-28"
                    disabled={finalLocked}
                    placeholder="Ads Cost"
                  />
                  <input
                    type="number"
                    min="0"
                    value={finalInputDraft.acquisition}
                    onChange={e => setFinalInputDraft(d => ({ ...d, acquisition: Number(e.target.value) }))}
                    className="border rounded px-2 py-1 w-36"
                    disabled={finalLocked}
                    placeholder="Acquisition Cost"
                  />
                </div>
                <button
                  className={`ml-2 p-1 rounded-full border ${finalLocked ? 'border-gray-300 bg-gray-100' : 'border-red-400 bg-red-50'} transition-all duration-200`}
                  onClick={() => setFinalLocked(l => !l)}
                  title={finalLocked ? 'Unlock to edit' : 'Lock'}
                  type="button"
                >
                  {finalLocked ? <Lock className="h-5 w-5 text-gray-500" /> : <Unlock className="h-5 w-5 text-red-500" />}
                </button>
                {!finalLocked && (
                  <button
                    className="px-3 py-1 rounded bg-red-600 text-white flex items-center hover:bg-red-700 transition-all duration-200 ml-2"
                    onClick={() => {
                      setFinalInputs(finalInputDraft);
                      localStorage.setItem('usps_final_expenses_' + finalMonth, JSON.stringify(finalInputDraft));
                      setFinalLocked(true);
                    }}
                    type="button"
                  >
                    <SaveIcon className="h-4 w-4 mr-1" /> Save
                  </button>
                )}
              </div>
            </div>
          </div>
          {(() => {
            // Pull gross profit from Profit Analysis for the month
            const [year, month] = finalMonth.split('-');
            const monthLabels = labels.filter(label => {
              const d = new Date(label.entryDate || label.createdAt);
              return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
            });
            // Use cost per label from localStorage for this month
            const costPerLabel = Number(localStorage.getItem('usps_cost_per_label_' + finalMonth) || 0.10);
            // Group by employee
            const employeeMap = {};
            monthLabels.forEach(label => {
              const empId = label.employeeId?._id;
              if (!empId) return;
              if (!employeeMap[empId]) employeeMap[empId] = [];
              employeeMap[empId].push(label);
            });
            const profitRows = Object.entries(employeeMap).map(([empId, empLabels]) => {
              const totalLabels = empLabels.reduce((sum, l) => sum + Number(l.totalLabels || 0), 0);
              const totalRevenue = empLabels.reduce((sum, l) => sum + Number(l.totalRevenue || 0), 0);
              const totalCost = totalLabels * costPerLabel;
              const grossProfit = totalRevenue - totalCost;
              return grossProfit;
            });
            const grossProfit = profitRows.reduce((sum, gp) => sum + gp, 0);
            const totalExpenses = finalInputs.office + finalInputs.internet + finalInputs.ads + finalInputs.acquisition;
            const netProfit = grossProfit - totalExpenses;
            return (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-700">Final Calculations for {finalMonth}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center">
                    <Trophy className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-lg font-semibold text-green-700">Gross Profit</div>
                      <div className="text-2xl font-bold text-green-900">${grossProfit.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center">
                    <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <div className="text-lg font-semibold text-yellow-700">Total Expenses</div>
                      <div className="text-2xl font-bold text-yellow-900">${totalExpenses.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex items-center">
                    <Trophy className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <div className="text-lg font-semibold text-red-700">Net Profit</div>
                      <div className="text-2xl font-bold text-red-900">${netProfit.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Expense Type</th>
                      <th className="p-2 text-center">Amount ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2">Office Expense</td><td className="p-2 text-center">${finalInputs.office.toFixed(2)}</td></tr>
                    <tr><td className="p-2">Internet Bills</td><td className="p-2 text-center">${finalInputs.internet.toFixed(2)}</td></tr>
                    <tr><td className="p-2">Ads Cost</td><td className="p-2 text-center">${finalInputs.ads.toFixed(2)}</td></tr>
                    <tr><td className="p-2">Customer Acquisition</td><td className="p-2 text-center">${finalInputs.acquisition.toFixed(2)}</td></tr>
                    <tr className="font-bold bg-gray-50"><td className="p-2">Total Expenses</td><td className="p-2 text-center">${totalExpenses.toFixed(2)}</td></tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default USPSLabelsTabAdmin; 
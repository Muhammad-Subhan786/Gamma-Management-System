import React, { useState, useEffect } from 'react';
import { employeeAPI, analyticsAPI, attendanceAPI } from '../services/api';
import { 
  Users, 
  Edit, 
  Trash2, 
  Search, 
  BarChart3, 
  Clock, 
  TrendingUp,
  UserPlus,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  Power,
  DollarSign,
  Code,
  Shield,
  CheckCircle,
  Crown,
  Sparkles,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import moment from 'moment';
import ShiftsTab from './ShiftsTab';
import SessionManagementTab from './SessionManagementTab';
import AdminTasksBoard from './AdminTasksBoard';
import AuraNestTab from './AuraNestTab';
import USPSLabelsTabAdmin from './USPSLabelsTabAdmin';

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftEnded, setShiftEnded] = useState(false);
  const [shiftEndTime, setShiftEndTime] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    cnic: '',
    dob: '',
    address: '',
    bankAccount: '',
    role: ''
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesRes, summaryRes, totalHoursRes, topPunctualRes, topHardworkingRes, shiftStatusRes] = await Promise.all([
        employeeAPI.getAll(),
        analyticsAPI.getSummary(),
        analyticsAPI.getTotalHours(),
        analyticsAPI.getTopPunctual(),
        analyticsAPI.getTopHardworking(),
        attendanceAPI.getShiftStatus()
      ]);

      setEmployees(employeesRes.data);
      setAnalytics({
        summary: summaryRes.data,
        totalHours: totalHoursRes.data,
        topPunctual: topPunctualRes.data,
        topHardworking: topHardworkingRes.data
      });
      setShiftEnded(shiftStatusRes.data.shiftEnded);
      setShiftEndTime(shiftStatusRes.data.shiftEndTime);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeToGo = async () => {
    if (!window.confirm('Ready to wrap up the day for everyone? Thanks for all the hard work! 💪')) {
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.timeToGo();
      if (response.data.success) {
        setShiftEnded(true);
        setShiftEndTime(response.data.shiftEndTime);
        alert('Great work today, everyone! Shift wrapped up successfully! 🌟');
      } else {
        alert('Oops! Something went wrong: ' + response.data.error);
      }
    } catch (error) {
      alert('Something went wrong: ' + error.response?.data?.error || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    const message = shiftEnded 
      ? 'Ready to start fresh? Let\'s get everyone back to work! 🌅'
      : 'Ready to kick off another amazing day with the team? 🌟';
    
    if (!window.confirm(message)) {
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.startShift();
      if (response.data.success) {
        setShiftEnded(false);
        setShiftEndTime(null);
        alert(`Let's do this! ${response.data.action} successfully! 🚀`);
        // Reload data to get updated status
        loadData();
      } else {
        alert('Oops! Something went wrong: ' + response.data.error);
      }
    } catch (error) {
      alert('Something went wrong: ' + error.response?.data?.error || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openModal = (type, employee = null) => {
    setModalType(type);
    setSelectedEmployee(employee);
    if (type === 'edit' && employee) {
      setFormData({
        employeeId: employee.employeeId || '',
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        cnic: employee.cnic,
        dob: moment(employee.dob).format('YYYY-MM-DD'),
        address: employee.address,
        bankAccount: employee.bankAccount,
        role: employee.role
      });
    } else {
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        cnic: '',
        dob: '',
        address: '',
        bankAccount: '',
        role: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      cnic: '',
      dob: '',
      address: '',
      bankAccount: '',
      role: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modalType === 'add') {
        await employeeAPI.create(formData);
        alert('Team member added successfully! 🎉');
      } else {
        await employeeAPI.update(selectedEmployee._id, formData);
        alert('Team member updated successfully! ✨');
      }
      closeModal();
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      await employeeAPI.delete(id);
      alert('Team member removed successfully! 🗑️');
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const DashboardTab = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center">
              <Crown className="h-8 w-8 mr-3 text-yellow-300" />
              Welcome to Admin Hub
            </h2>
            <p className="text-blue-100 text-lg">Manage your team, track performance, and drive success</p>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{employees.length}</div>
              <div className="text-blue-200 text-sm">Team Members</div>
            </div>
            <div className="w-px h-12 bg-blue-400"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{analytics.summary?.totalCheckIns || 0}</div>
              <div className="text-blue-200 text-sm">Today's Check-ins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => openModal('add')}
          className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Add Team Member</p>
              <p className="text-lg font-semibold text-gray-900">New Employee</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleStartShift}
          className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-1"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Start Shift</p>
              <p className="text-lg font-semibold text-gray-900">Begin Day</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleTimeToGo}
          className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 transform hover:-translate-y-1"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">End Shift</p>
              <p className="text-lg font-semibold text-gray-900">Wrap Up</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 transform hover:-translate-y-1"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">View Analytics</p>
              <p className="text-lg font-semibold text-gray-900">Reports</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Team</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.summary?.presentToday || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalHours?.totalHours || 0}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Hours</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalHours?.averageHours || 0}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Attendance Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.summary?.dailyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="checkIns" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Performance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'On Time', value: analytics.summary?.onTime || 0 },
                  { name: 'Late', value: analytics.summary?.late || 0 },
                  { name: 'Absent', value: analytics.summary?.absent || 0 }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Top Punctual Team Members
          </h3>
          <div className="space-y-3">
            {analytics.topPunctual?.slice(0, 5).map((employee, index) => (
              <div key={employee._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{employee.onTimeDays} days</p>
                  <p className="text-xs text-gray-500">On time</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Most Hardworking Team Members
          </h3>
          <div className="space-y-3">
            {analytics.topHardworking?.slice(0, 5).map((employee, index) => (
              <div key={employee._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">{employee.totalHours}h</p>
                  <p className="text-xs text-gray-500">Total hours</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const EmployeesTab = () => {
    const filteredEmployees = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-600" />
              Team Members
            </h2>
            <p className="text-gray-600 mt-1">Manage your team members and their information</p>
          </div>
          <button
            onClick={() => openModal('add')}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add Team Member
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.email}</div>
                      <div className="text-sm text-gray-500">{employee.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                        {employee.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => openModal('edit', employee)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                          title="Edit team member"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee._id)}
                          className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                          title="Remove team member"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {searchTerm ? 'No team members found matching your search' : 'No team members yet'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm ? 'Try a different search term' : 'Add your first team member to get started!'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              {/* Enhanced Logo */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Hub
                </h1>
                <p className="text-sm text-gray-600 mt-1 flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Command Center for Team Management
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Check-In Page
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  window.location.href = '/admin-login';
                }}
                className="flex items-center px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <Power className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'shifts'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Shifts
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Session Management
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('aura-nest')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'aura-nest'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Aura Nest
            </button>
            <button
              onClick={() => setActiveTab('usps-labels')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'usps-labels'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Code className="h-4 w-4 mr-2" />
              USPS Labels
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'employees' && <EmployeesTab />}
            {activeTab === 'shifts' && <ShiftsTab />}
            {activeTab === 'sessions' && <SessionManagementTab />}
            {activeTab === 'tasks' && <AdminTasksBoard />}
            {activeTab === 'aura-nest' && <AuraNestTab />}
            {activeTab === 'usps-labels' && <USPSLabelsTabAdmin />}
          </>
        )}
      </div>

      {/* Enhanced Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                {modalType === 'add' ? 'Add New Team Member' : 'Edit Team Member'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required={modalType === 'add'}
                    disabled={modalType === 'edit'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CNIC</label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      rows="3"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (modalType === 'add' ? 'Add Team Member' : 'Update Team Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal; 
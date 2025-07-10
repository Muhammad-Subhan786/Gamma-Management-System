import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { 
  BarChart3, 
  User, 
  Calendar, 
  CheckCircle, 
  DollarSign, 
  Home, 
  LogOut, 
  AlertTriangle,
  Menu,
  X,
  Briefcase
} from 'lucide-react';
import ProfileTab from './employee/ProfileTab';
import DashboardTab from './employee/DashboardTab';
import ShiftsTab from './employee/ShiftsTab';
import TasksBoard from './employee/TasksBoard';
import OrdersManagement from './OrdersManagement';
import TransactionsManagement from './TransactionsManagement';
import AuraNestTab from './AuraNestTab';
import USPSLabelsTab from './employee/USPSLabelsTab';

// Add a simple LeadsTab for employees if import fails
const EmployeeLeadsTab = () => {
  // Minimal state for demonstration
  const [leads, setLeads] = React.useState([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', phone: '', product: '', price: '' });

  const loadLeads = async () => {
    // TODO: Replace with real API call
    setLeads([{ name: 'Ali', phone: '03001234567', product: 'Ring', price: '5000' }]);
  };
  React.useEffect(() => { loadLeads(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLeads([...leads, form]);
    setForm({ name: '', phone: '', product: '', price: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add Lead</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2 bg-white p-4 rounded-lg shadow">
          <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="input-field" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          <input className="input-field" placeholder="Product" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} required />
          <input className="input-field" placeholder="Expected Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg">Save</button>
        </form>
      )}
      <div className="card">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead, idx) => (
              <tr key={idx} className="hover:bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.product}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">PKR {lead.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EmployeePortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('employeeToken');
    if (!token) {
      navigate('/employee-login');
      return;
    }

    try {
      // Always try to fetch the latest profile from the backend
      const response = await employeeAPI.getProfile();
      const freshEmployeeData = response.data;
      setEmployee(freshEmployeeData);
      localStorage.setItem('employeeData', JSON.stringify(freshEmployeeData));
    } catch (refreshError) {
      // If API call fails, fallback to localStorage
      const employeeData = localStorage.getItem('employeeData');
      if (employeeData) {
        try {
          setEmployee(JSON.parse(employeeData));
        } catch (error) {
          localStorage.removeItem('employeeToken');
          localStorage.removeItem('employeeData');
          navigate('/employee-login');
        }
      } else {
        localStorage.removeItem('employeeToken');
        localStorage.removeItem('employeeData');
        navigate('/employee-login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeData');
    navigate('/employee-login');
  };

  const updateEmployeeData = (newData) => {
    setEmployee(newData);
    localStorage.setItem('employeeData', JSON.stringify(newData));
  };

  // Helper function to check if employee has access to a session
  const hasSessionAccess = useCallback((sessionId) => {
    if (!employee || !employee.allowedSessions) return false;
    return employee.allowedSessions.includes(sessionId);
  }, [employee]);

  // Get available tabs based on session permissions
  const getAvailableTabs = useCallback(() => {
    const tabs = [
      { id: 'dashboard', label: 'My Dashboard', icon: BarChart3, alwaysVisible: true },
      { id: 'profile', label: 'My Profile', icon: User, alwaysVisible: true },
      { id: 'shifts', label: 'My Shifts', icon: Calendar, alwaysVisible: true },
      { id: 'tasks', label: 'My Tasks', icon: CheckCircle, sessionId: 'tasks' },
      { id: 'aura_nest', label: 'Aura Nest', icon: DollarSign, sessionId: 'aura_nest' },
      { id: 'usps_labels', label: 'My USPS Labels', icon: Home, sessionId: 'usps_labels' }
    ];

    return tabs.filter(tab => tab.alwaysVisible || hasSessionAccess(tab.sessionId));
  }, [employee, hasSessionAccess]);

  // Set default active tab if current tab is not available
  useEffect(() => {
    if (employee) {
      const availableTabs = getAvailableTabs();
      const isCurrentTabAvailable = availableTabs.some(tab => tab.id === activeTab);
      
      if (!isCurrentTabAvailable && availableTabs.length > 0) {
        setActiveTab(availableTabs[0].id);
      }
    }
  }, [employee, activeTab, getAvailableTabs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Team Hub
                </h1>
                <p className="text-xs text-gray-500 font-medium">Your Digital Workspace</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                  {employee.profilePicture ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/api/employees/profile-picture/${employee._id}`}
                      alt={employee.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.position}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-100 py-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                  {employee.profilePicture ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/api/employees/profile-picture/${employee._id}`}
                      alt={employee.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.position}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 sm:space-x-8 min-w-full">
              {availableTabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' ? (
          <DashboardTab employee={employee} />
        ) : activeTab === 'profile' ? (
          <ProfileTab 
            employee={employee} 
            updateEmployeeData={updateEmployeeData}
          />
        ) : activeTab === 'shifts' ? (
          <ShiftsTab employee={employee} />
        ) : activeTab === 'tasks' ? (
          hasSessionAccess('tasks') ? (
            <TasksBoard employee={employee} />
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access Tasks.</p>
            </div>
          )
        ) : activeTab === 'aura_nest' ? (
          hasSessionAccess('aura_nest') ? (
            <AuraNestTab employee={employee} />
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access Aura Nest.</p>
            </div>
          )
        ) : activeTab === 'usps_labels' ? (
          hasSessionAccess('usps_labels') ? (
            <USPSLabelsTab employee={employee} />
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access USPS Labels.</p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-600">The requested page is not available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePortal; 
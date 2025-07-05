import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { 
  User, 
  BarChart3, 
  LogOut, 
  Settings, 
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Heart,
  Home
} from 'lucide-react';
import ProfileTab from './employee/ProfileTab';
import DashboardTab from './employee/DashboardTab';
import ShiftsTab from './employee/ShiftsTab';
import TasksBoard from './employee/TasksBoard';
import AuraNestTab from './AuraNestTab';
import USPSLabelsTab from './employee/USPSLabelsTab';

const EmployeePortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
  };

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
  const hasSessionAccess = (sessionId) => {
    if (!employee || !employee.allowedSessions) return false;
    return employee.allowedSessions.includes(sessionId);
  };

  // Get available tabs based on session permissions
  const getAvailableTabs = () => {
    const tabs = [
      { id: 'dashboard', label: 'My Dashboard', icon: BarChart3, alwaysVisible: true },
      { id: 'profile', label: 'My Profile', icon: User, alwaysVisible: true },
      { id: 'shifts', label: 'My Shifts', icon: Calendar, alwaysVisible: true },
      { id: 'tasks', label: 'My Tasks', icon: CheckCircle, sessionId: 'tasks' },
      { id: 'aura_nest', label: 'Aura Nest', icon: DollarSign, sessionId: 'aura_nest' },
      { id: 'usps_labels', label: 'My USPS Labels', icon: Home, sessionId: 'usps_labels' }
    ];

    return tabs.filter(tab => tab.alwaysVisible || hasSessionAccess(tab.sessionId));
  };

  // Set default active tab if current tab is not available
  useEffect(() => {
    if (employee) {
      const availableTabs = getAvailableTabs();
      const isCurrentTabAvailable = availableTabs.some(tab => tab.id === activeTab);
      
      if (!isCurrentTabAvailable && availableTabs.length > 0) {
        setActiveTab(availableTabs[0].id);
      }
    }
  }, [employee]);

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
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              {/* Company Logo */}
              <img src="/logo.png" alt="Company Logo" className="h-16 w-16 rounded-xl shadow-lg object-cover border-4 border-white bg-white" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome back! 👋
                </h1>
                <p className="text-sm text-gray-600 mt-1">Your personal team space</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                  {employee.profilePicture ? (
                    <img 
                      src={`/api/employees/profile-picture/${employee._id}`}
                      alt={employee.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-lg font-semibold text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-500">{employee.position}</p>
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
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {availableTabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <AuraNestTab />
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
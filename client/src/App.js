import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import CheckInPage from './components/CheckInPage';
import AdminPortal from './components/AdminPortal';
import AdminLogin from './components/AdminLogin';
import EmployeeLogin from './components/EmployeeLogin';
import EmployeePortal from './components/EmployeePortal';
import { Users, Clock, BarChart3, LogOut, User } from 'lucide-react';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Update isAdmin state based on current route
  useEffect(() => {
    setIsAdmin(location.pathname === '/admin');
  }, [location.pathname]);

  const handleAdminToggle = () => {
    if (isAdmin) {
      navigate('/');
    } else {
      // Check if user is authenticated before allowing admin access
      if (isAuthenticated) {
        navigate('/admin');
      } else {
        navigate('/admin-login');
      }
    }
  };

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Only show if not on login page */}
      {location.pathname !== '/admin-login' && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <Clock className="h-8 w-8 text-primary-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    Employee Attendance
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Check-In
                </Link>
                <Link
                  to="/employee-login"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <User className="h-4 w-4 mr-1" />
                  Employee Portal
                </Link>
                <button
                  onClick={handleAdminToggle}
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {isAdmin ? 'Exit Admin' : 'Admin Portal'}
                </button>
                {isAuthenticated && isAdmin && (
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={location.pathname !== '/admin-login' ? 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8' : ''}>
        <Routes>
          <Route path="/" element={<CheckInPage />} />
          <Route path="/admin-login" element={<AdminLogin onLogin={handleLogin} />} />
          <Route 
            path="/admin" 
            element={
              isAuthenticated ? <AdminPortal /> : <AdminLogin onLogin={handleLogin} />
            } 
          />
          <Route path="/employee-login" element={<EmployeeLogin />} />
          <Route path="/employee-portal" element={<EmployeePortal />} />
        </Routes>
      </main>

      {/* Footer - Only show if not on login page */}
      {location.pathname !== '/admin-login' && (
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500 text-sm">
              © 2024 Employee Attendance System. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App; 
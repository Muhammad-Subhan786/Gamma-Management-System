import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import CheckInPage from './components/CheckInPage';
import AdminPortal from './components/AdminPortal';
import AdminLogin from './components/AdminLogin';
import EmployeeLogin from './components/EmployeeLogin';
import EmployeePortal from './components/EmployeePortal';
import { 
  Users, 
  Clock, 
  BarChart3, 
  LogOut, 
  User, 
  Sparkles, 
  Home, 
  Target, 
  Menu, 
  X,
  Briefcase
} from 'lucide-react';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Don't show header on login pages
  const hideHeader = ['/admin-login', '/employee-login', '/employee-portal', '/admin'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header - Only show if not on login/portal pages */}
      {!hideHeader && (
        <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Employee Portal
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">Management System</p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-6">
                <Link
                  to="/"
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Check-In
                </Link>
                <Link
                  to="/employee-login"
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                >
                  <User className="h-4 w-4 mr-2" />
                  Team Portal
                </Link>
                <button
                  onClick={handleAdminToggle}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isAdmin ? 'Exit Admin' : 'Admin Hub'}
                </button>
                {isAuthenticated && isAdmin && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                )}
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
                <div className="space-y-3">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Check-In
                  </Link>
                  <Link
                    to="/employee-login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Team Portal
                  </Link>
                  <button
                    onClick={() => {
                      handleAdminToggle();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Exit Admin' : 'Admin Hub'}
                  </button>
                  {isAuthenticated && isAdmin && (
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={!hideHeader ? 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8' : ''}>
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

      {/* Footer - Only show if not on login/portal pages */}
      {!hideHeader && (
        <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-100 mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500 text-sm">
              © 2024 Employee Portal Management System. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App; 
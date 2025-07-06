import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Shield, 
  Settings, 
  Crown, 
  Zap, 
  Target, 
  BarChart3, 
  Users, 
  Database,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);


  // Auto-rotate admin features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const adminFeatures = [
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into team performance and productivity"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Management",
      description: "Full control over employee data, permissions, and access"
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "Data Control",
      description: "Secure management of all system data and configurations"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Strategic Oversight",
      description: "Monitor and optimize business operations and workflows"
    }
  ];

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setLoginAttempts(prev => prev + 1);
    
    // Simple authentication - you can change these credentials
    const adminCredentials = {
      username: 'admin',
      password: 'admin123'
    };

    // Simulate API call delay with enhanced security feel
    setTimeout(() => {
      if (credentials.username === adminCredentials.username && 
          credentials.password === adminCredentials.password) {
        // Store authentication state
        localStorage.setItem('isAdminAuthenticated', 'true');
        onLogin(true);
      } else {
        setError('Invalid credentials. Please verify your admin access.');
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Animated Background with Admin Aura */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Geometric patterns for admin feel */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-purple-400 rotate-45 animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-blue-400 rotate-12 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-32 left-32 w-28 h-28 border border-indigo-400 rotate-90 animate-pulse animation-delay-4000"></div>
          <div className="absolute bottom-20 right-20 w-20 h-20 border border-purple-400 rotate-180 animate-pulse animation-delay-1000"></div>
        </div>
        
        {/* Floating particles for aura effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative w-full flex">
        {/* Left Side - Admin Features */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-md space-y-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-2xl border-4 border-purple-300/30">
                  <Crown className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  Admin Hub
                </h1>
                <p className="text-xl text-gray-300 font-medium">
                  Command Center for System Management
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-1000"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-2000"></div>
                </div>
              </div>
            </div>

            {/* Admin Feature Showcase */}
            <div className="space-y-6">
              {adminFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-4 p-6 rounded-2xl transition-all duration-700 ${
                    currentFeature === index
                      ? 'bg-white/10 backdrop-blur-sm shadow-2xl scale-105 border border-purple-400/30'
                      : 'bg-white/5 backdrop-blur-sm'
                  }`}
                >
                  <div className={`p-4 rounded-xl transition-all duration-500 ${
                    currentFeature === index
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                      : 'bg-white/10 text-gray-300'
                  }`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg transition-colors ${
                      currentFeature === index ? 'text-white' : 'text-gray-300'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm transition-colors ${
                      currentFeature === index ? 'text-gray-200' : 'text-gray-400'
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold text-purple-400">24/7</div>
                <div className="text-xs text-gray-400">System Access</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold text-blue-400">100%</div>
                <div className="text-xs text-gray-400">Control</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold text-indigo-400">∞</div>
                <div className="text-xs text-gray-400">Possibilities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Header */}
            <div className="lg:hidden text-center space-y-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-purple-300/30">
                  <Crown className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Admin Hub
                </h1>
                <p className="text-lg text-gray-300 font-medium">
                  Command Center Access
                </p>
              </div>
            </div>

            {/* Login Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Secure Admin Access
                </h2>
                <p className="text-gray-300 text-sm">
                  Enter your credentials to access the command center
                </p>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-200 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Admin Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={credentials.username}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm"
                        placeholder="Enter admin username"
                      />
                      {isTyping && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="animate-pulse">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-3 flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={credentials.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-4 bg-white/10 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm"
                        placeholder="Enter admin password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-300">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-purple-800 disabled:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Access Command Center
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Admin Credentials Info */}
              <div className="mt-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Default Admin Credentials:
                </h3>
                <div className="text-sm text-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Username:</span>
                    <code className="bg-white/10 px-2 py-1 rounded text-blue-100">admin</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Password:</span>
                    <code className="bg-white/10 px-2 py-1 rounded text-blue-100">admin123</code>
                  </div>
                </div>
                <p className="text-xs text-blue-300 mt-3">
                  ⚠️ Change these credentials in production for security
                </p>
              </div>

              {/* Security Features */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <Shield className="h-6 w-6 text-green-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-300">Secure</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <Target className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-300">Protected</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-300">Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 
import React, { useState, useEffect } from 'react';
import { attendanceAPI, analyticsAPI, employeeAPI } from '../services/api';
import { 
  Clock, 
  User, 
  LogIn, 
  LogOut, 
  AlertTriangle, 
  Users, 
  Heart, 
  Coffee, 
  Home, 
  Code, 
  Globe, 
  Zap, 
  Sparkles, 
  Sun, 
  Star, 
  Target, 
  TrendingUp,
  Bell,
  Smile
} from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';

const CheckInPage = () => {
  const [formData, setFormData] = useState({
    employeeId: ''
  });
    const [currentTime, setCurrentTime] = useState(new Date());
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [todayCheckIns, setTodayCheckIns] = useState([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [shiftEnded, setShiftEnded] = useState(false);
  const [shiftEndTime, setShiftEndTime] = useState(null);
  const [employeeShiftEnded, setEmployeeShiftEnded] = useState(false);
  const [employeeShiftEndTime, setEmployeeShiftEndTime] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load today's check-ins
  useEffect(() => {
    loadTodayCheckIns();
    loadShiftStatus();
  }, []);

  const features = [
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Time Tracking",
      description: "Track your work hours and project time efficiently"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Management",
      description: "Manage your software development team seamlessly"
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: "Project Oversight",
      description: "Monitor project progress and team performance"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Performance Analytics",
      description: "Get insights into team productivity and efficiency"
    }
  ];

  const loadTodayCheckIns = async () => {
    setLoadingCheckIns(true);
    try {
      const response = await analyticsAPI.getSummary();
      // Get today's attendance data
      const today = moment().startOf('day');
      const checkInsResponse = await attendanceAPI.getTodayCheckIns(today.format('YYYY-MM-DD'));
      if (checkInsResponse.data) {
        setTodayCheckIns(checkInsResponse.data);
      }
    } catch (error) {
      console.error('Error loading check-ins:', error);
    } finally {
      setLoadingCheckIns(false);
    }
  };

  const loadShiftStatus = async () => {
    try {
      const response = await attendanceAPI.getShiftStatus();
      setShiftEnded(response.data.shiftEnded);
      setShiftEndTime(response.data.shiftEndTime);
    } catch (error) {
      console.error('Error loading shift status:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  // Fetch employee data when employeeId changes
  useEffect(() => {
    if (formData.employeeId) {
      const id = formData.employeeId.trim().toLowerCase();
      employeeAPI.search(id)
        .then(response => {
          const data = response.data;
          // If search returns an array, find exact match (case-insensitive)
          const found = Array.isArray(data)
            ? data.find(emp => emp.employeeId && emp.employeeId.toLowerCase() === id)
            : null;
          setEmployeeData(found || null);
        })
        .catch(() => setEmployeeData(null));
    } else {
      setEmployeeData(null);
    }
  }, [formData.employeeId]);

  const checkEmployeeShiftStatus = async () => {
    if (!formData.employeeId) {
      setEmployeeShiftEnded(false);
      setEmployeeShiftEndTime(null);
      return;
    }
    try {
      const response = await attendanceAPI.getEmployeeShiftStatusById(formData.employeeId);
      setEmployeeShiftEnded(response.data.shiftEnded);
      setEmployeeShiftEndTime(response.data.shiftEndTime);
    } catch (error) {
      setEmployeeShiftEnded(false);
      setEmployeeShiftEndTime(null);
    }
  };

  // Check employee shift status when name/email changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkEmployeeShiftStatus();
    }, 500); // Debounce the check

    return () => clearTimeout(timeoutId);
  }, [formData.employeeId, checkEmployeeShiftStatus]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) {
      setModalData({
        title: 'Hey there! 👋',
        message: 'Please enter your Employee ID so we can welcome you properly!',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    if (shiftEnded) {
      setModalData({
        title: 'Shift Complete! 🌟',
        message: 'Great work today, everyone! The shift has wrapped up for the day.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.checkIn({ employeeId: formData.employeeId });
      setCheckInStatus(response.data);
      
      setModalData({
        title: response.data.isLate ? 'Welcome back! ☕' : 'Welcome! 🎉',
        message: response.data.isLate 
          ? `${response.data.message} Grab a coffee and let\'s make today amazing!`
          : `${response.data.message} You\'re right on time - let\'s have a fantastic day!`,
        type: response.data.isLate ? 'warning' : 'success',
        checkInTime: response.data.checkInTime,
        employee: employeeData
      });
      setShowModal(true);
      
      // Clear form after successful check-in
      setFormData({ employeeId: '' });
      setEmployeeData(null);
      
      // Reload check-ins to show the new entry
      loadTodayCheckIns();
    } catch (error) {
      setModalData({
        title: 'Oops! 😅',
        message: error.response?.data?.error || 'Something went wrong, but don\'t worry - we\'ll figure it out together!',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) {
      setModalData({
        title: 'Hey there! 👋',
        message: 'Please enter your Employee ID so we can say goodbye properly!',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    if (shiftEnded) {
      setModalData({
        title: 'Shift Complete! 🌟',
        message: 'Great work today, everyone! The shift has wrapped up for the day.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.checkOut({ employeeId: formData.employeeId });
      setCheckInStatus(null);
      
      setModalData({
        title: 'Great work today! 🌟',
        message: `${response.data.message} You've done an amazing job!`,
        type: 'success',
        checkOutTime: response.data.checkOutTime,
        totalHours: response.data.totalHours,
        employee: employeeData
      });
      setShowModal(true);
      
      // Clear form after successful check-out
      setFormData({ employeeId: '' });
      setEmployeeData(null);
      
      // Reload check-ins to show the updated entry
      loadTodayCheckIns();
    } catch (error) {
      setModalData({
        title: 'Oops! 😅',
        message: error.response?.data?.error || 'Something went wrong, but don\'t worry - we\'ll figure it out together!',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeToGo = async () => {
    if (!formData.employeeId) {
      setModalData({
        title: 'Hey there! 👋',
        message: 'Please enter your Employee ID first!',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.endShiftForEmployee({ employeeId: formData.employeeId });
      setModalData({
        title: 'Shift Ended! 🌙',
        message: `${response.data.message} Great work today!`,
        type: 'success'
      });
      setShowModal(true);
      
      // Clear form
      setFormData({ employeeId: '' });
      setEmployeeData(null);
      
      // Reload data
      loadShiftStatus();
      loadTodayCheckIns();
    } catch (error) {
      setModalData({
        title: 'Oops! 😅',
        message: error.response?.data?.error || 'Something went wrong!',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    setLoading(true);
    try {
      const response = await attendanceAPI.startShift();
      setModalData({
        title: 'New Day Started! 🌅',
        message: `${response.data.message} Let's make today amazing!`,
        type: 'success'
      });
      setShowModal(true);
      
      // Reload data
      loadShiftStatus();
      loadTodayCheckIns();
    } catch (error) {
      setModalData({
        title: 'Oops! 😅',
        message: error.response?.data?.error || 'Something went wrong!',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData({});
  };

  const getModalIcon = () => {
    switch (modalData.type) {
      case 'success':
        return <Heart className="h-12 w-12 text-green-500" />;
      case 'warning':
        return <Coffee className="h-12 w-12 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-12 w-12 text-red-500" />;
      default:
        return <Heart className="h-12 w-12 text-primary-500" />;
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: "Good Morning", icon: "🌅", color: "from-yellow-400 to-orange-500" };
    if (hour < 17) return { text: "Good Afternoon", icon: "☀️", color: "from-blue-400 to-purple-500" };
    return { text: "Good Evening", icon: "🌙", color: "from-purple-400 to-indigo-500" };
  };

  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full space-y-8">
          {/* Header with Logo */}
          <div className="text-center">
            {/* Company Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {greeting.text}, Folks! {greeting.icon}
              </h2>
              <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
                Let's start your day together - check in and let's make today absolutely amazing!
              </p>
              <div className="text-sm text-gray-500 mb-6 flex justify-center items-center space-x-4">
                <span className="font-semibold text-blue-600 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Ebay, Wallmart
                </span>
                <span className="font-semibold text-purple-600 flex items-center">
                  <Code className="h-4 w-4 mr-1" />
                  Software House
                </span>
                <span className="font-semibold text-indigo-600 flex items-center">
                  <Zap className="h-4 w-4 mr-1" />
                  Ecommerce Solutions
                </span>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Link 
                  to="/employee-login" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Team Portal
                </Link>
                <Link 
                  to="/admin-login" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Admin Hub
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Check-in Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Time Display */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center border border-white/20">
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 font-mono">
                  {moment(currentTime).format('HH:mm:ss')}
                </div>
                <div className="text-xl text-gray-600 mb-2">
                  {moment(currentTime).format('dddd, MMMM Do YYYY')}
                </div>
                <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
                  <Sun className="h-4 w-4" />
                  <span>✨ Have a wonderful day! ✨</span>
                  <Star className="h-4 w-4" />
                </div>
              </div>

              {/* Check-in Form */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                {/* Shift Status */}
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                        <Bell className="h-5 w-5 mr-2" />
                        Team Status
                      </h4>
                      <p className={`text-base font-medium ${shiftEnded ? 'text-red-600' : 'text-green-600'} flex items-center`}>
                        {shiftEnded ? '🌙 Team wrapped up for the day' : '☀️ Team is active and working'}
                      </p>
                      {shiftEndTime && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Team finished at: {moment(shiftEndTime).format('HH:mm')}
                        </p>
                      )}
                      {formData.employeeId && employeeData ? (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="flex items-center space-x-3">
                            {employeeData.profilePicture && (
                              <img src={`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/api/employees/profile-picture/${employeeData._id}`} alt={employeeData.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md" />
                            )}
                            <span className="font-semibold text-gray-900 text-lg">{employeeData.name}</span>
                          </div>
                          <p className={`text-sm font-medium ${employeeShiftEnded ? 'text-red-600' : 'text-green-600'} mt-1`}>
                            {employeeShiftEnded ? '🏠 You\'re done for today' : '💪 You\'re still active'}
                          </p>
                          {employeeShiftEndTime && (
                            <p className="text-xs text-gray-500 mt-1">You finished at: {moment(employeeShiftEndTime).format('HH:mm')}</p>
                          )}
                        </div>
                      ) : formData.employeeId && !employeeData ? (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-sm text-red-600 font-semibold flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Employee ID not found. Please check your ID.
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex space-x-2">
                      {shiftEnded ? (
                        <button
                          onClick={handleStartShift}
                          disabled={loading}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                        >
                          {loading ? 'Starting...' : '🌅 Start Fresh'}
                        </button>
                      ) : (
                        <button
                          onClick={handleTimeToGo}
                          disabled={loading || !formData.employeeId || employeeShiftEnded}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                        >
                          {loading ? 'Wrapping up...' : '🏠 Call it a Day'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <form className="space-y-6">
                  <div>
                    <label htmlFor="employeeId" className="block text-lg font-semibold text-gray-700 mb-3 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Employee ID 🆔
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                      <input
                        id="employeeId"
                        name="employeeId"
                        type="text"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg ${isTyping ? 'border-blue-400' : ''}`}
                        placeholder="Enter your Employee ID"
                        disabled={shiftEnded || employeeShiftEnded}
                      />
                      {isTyping && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="animate-pulse">
                            <Sparkles className="h-5 w-5 text-blue-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      disabled={loading || shiftEnded || employeeShiftEnded}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center text-lg"
                    >
                      <LogIn className="h-6 w-6 mr-2" />
                      {loading ? 'Welcome back...' : '🚀 Start My Day'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckOut}
                      disabled={loading || shiftEnded || employeeShiftEnded}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center text-lg"
                    >
                      <LogOut className="h-6 w-6 mr-2" />
                      {loading ? 'See you soon...' : '👋 End My Day'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Feature Showcase */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                  This portal is built for you to track, like
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-500 ${
                        currentFeature === index
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg scale-105 border border-blue-200'
                          : 'bg-gray-50/50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl transition-colors ${
                        currentFeature === index
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className={`font-semibold transition-colors ${
                          currentFeature === index ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {feature.title}
                        </h4>
                        <p className={`text-sm transition-colors ${
                          currentFeature === index ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Today's Team */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Users className="h-7 w-7 mr-3 text-blue-600" />
                    Today's Team
                  </h3>
                  <button
                    onClick={loadTodayCheckIns}
                    disabled={loadingCheckIns}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium flex items-center"
                  >
                    {loadingCheckIns ? 'Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {loadingCheckIns ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : todayCheckIns.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {todayCheckIns.map((checkIn, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                            {checkIn.employee.profilePicture ? (
                              <img 
                                src={`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/api/employees/profile-picture/${checkIn.employee._id}`}
                                alt={checkIn.employee.name}
                                className="w-12 h-12 object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span 
                              className={`text-lg font-bold text-white ${
                                checkIn.employee.profilePicture ? 'hidden' : 'flex'
                              }`}
                            >
                              {checkIn.employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <p className="font-semibold text-gray-900 text-lg">{checkIn.employee.name}</p>
                            <p className="text-sm text-gray-500">{checkIn.employee.position}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {moment(checkIn.checkInTime).format('HH:mm')}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center justify-end">
                            {checkIn.isLate ? '☕ Late but welcome!' : '🎉 Right on time!'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No one has checked in yet today</p>
                    <p className="text-sm text-gray-400 mt-2">Be the first to start the day! 🌅</p>
                  </div>
                )}
              </div>

              {/* Team Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="h-7 w-7 mr-3 text-red-500" />
                  Today's Team Stats
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {todayCheckIns.length}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">Team Members</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {todayCheckIns.filter(c => c.isLate).length}
                    </div>
                    <div className="text-sm text-orange-700 font-medium">Coffee Lovers ☕</div>
                  </div>
                </div>
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl text-center border border-green-200">
                  <p className="text-lg text-green-700 font-medium flex items-center justify-center">
                    <Smile className="h-5 w-5 mr-2" />
                    {todayCheckIns.length > 0 ? 'Amazing team effort today!' : 'Ready to make today amazing!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="animate-bounce mb-4">
                {getModalIcon()}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {modalData.title}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {modalData.message}
              </p>
              
              {modalData.checkInTime && (
                <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                  <p className="text-base text-green-700 font-medium">
                    <span className="font-bold">Check-in Time:</span> {modalData.checkInTime}
                  </p>
                  {modalData.employee && (
                    <p className="text-base text-green-700 mt-2">
                      <span className="font-bold">Welcome back:</span> {modalData.employee.name}
                    </p>
                  )}
                </div>
              )}
              
              {modalData.checkOutTime && (
                <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                  <p className="text-base text-orange-700 font-medium">
                    <span className="font-bold">Check-out Time:</span> {modalData.checkOutTime}
                  </p>
                  <p className="text-base text-orange-700 mt-2">
                    <span className="font-bold">Hours worked:</span> {modalData.totalHours} hours
                  </p>
                  {modalData.employee && (
                    <p className="text-base text-orange-700 mt-2">
                      <span className="font-bold">Great work:</span> {modalData.employee.name}
                    </p>
                  )}
                </div>
              )}
              
              <div className="mt-8">
                <button
                  onClick={closeModal}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Got it! 👍
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPage; 
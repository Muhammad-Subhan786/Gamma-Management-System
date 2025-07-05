import React, { useState, useEffect } from 'react';
import { attendanceAPI, analyticsAPI, employeeAPI } from '../services/api';
import { Clock, User, LogIn, LogOut, AlertTriangle, CheckCircle, Users, Heart, Coffee, Home, Code, Globe, Zap } from 'lucide-react';
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

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load today's check-ins
  useEffect(() => {
    loadTodayCheckIns();
    loadShiftStatus();
  }, []);

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
  }, [formData.employeeId]);

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
        title: 'See you tomorrow! 👋',
        message: `${response.data.message} Thanks for your hard work today - you\'re awesome!`,
        type: 'success',
        checkOutTime: response.data.checkOutTime,
        totalHours: response.data.totalHours,
        employee: employeeData
      });
      setShowModal(true);
      
      // Clear form after successful check-out
      setFormData({ employeeId: '' });
      setEmployeeData(null);
      
      // Reload check-ins to update the display
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
        message: 'Please enter your Employee ID so we can wrap up your day properly!',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    if (!window.confirm('Ready to call it a day? Thanks for your hard work! 💪')) {
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.employeeTimeToGo({ employeeId: formData.employeeId });
      if (response.data.success) {
        setModalData({
          title: 'Have a great evening! 🌙',
          message: response.data.message,
          type: 'success',
          employee: employeeData
        });
        setShowModal(true);
        setFormData({ employeeId: '' });
        setEmployeeData(null);
        loadTodayCheckIns();
      } else {
        setModalData({
          title: 'Oops! 😅',
          message: response.data.error || 'Something went wrong, but don\'t worry - we\'ll figure it out together!',
          type: 'error'
        });
        setShowModal(true);
      }
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
        setModalData({
          title: 'Let\'s do this! 🚀',
          message: response.data.message,
          type: 'success'
        });
        setShowModal(true);
        setShiftEnded(false);
        setShiftEndTime(null);
        loadTodayCheckIns();
      } else {
        setModalData({
          title: 'Oops! 😅',
          message: response.data.error || 'Something went wrong, but don\'t worry - we\'ll figure it out together!',
          type: 'error'
        });
        setShowModal(true);
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header with Logo */}
        <div className="text-center">
          {/* Company Logo */}
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Company Logo" className="h-24 w-24 rounded-2xl shadow-2xl object-cover border-4 border-white bg-white" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome, Folks! 👋
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Let's start your day together - check in and let's make today amazing!
          </p>
          <div className="text-sm text-gray-500 mb-6">
            <span className="font-semibold text-blue-600">Ebay, Wallmart</span> • 
            <span className="font-semibold text-purple-600"> Software House</span> • 
            <span className="font-semibold text-indigo-600"> Ecommerce Solutions</span>
          </div>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/employee-login" 
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Team Portal
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Check-in Form */}
          <div className="space-y-6">
            {/* Current Time Display */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {moment(currentTime).format('HH:mm:ss')}
              </div>
              <div className="text-lg text-gray-600">
                {moment(currentTime).format('dddd, MMMM Do YYYY')}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                ✨ Have a wonderful day! ✨
              </div>
            </div>

            {/* Check-in Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              {/* Shift Status */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Team Status</h4>
                    <p className={`text-sm font-medium ${shiftEnded ? 'text-red-600' : 'text-green-600'}`}>
                      {shiftEnded ? '🌙 Team wrapped up for the day' : '☀️ Team is active and working'}
                    </p>
                    {shiftEndTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        Team finished at: {moment(shiftEndTime).format('HH:mm')}
                      </p>
                    )}
                    {formData.employeeId && employeeData ? (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center space-x-3">
                          {employeeData.profilePicture && (
                            <img src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/employees/profile-picture/${employeeData._id}`} alt={employeeData.name} className="w-8 h-8 rounded-full object-cover" />
                          )}
                          <span className="font-semibold text-gray-900">{employeeData.name}</span>
                        </div>
                        <p className={`text-sm font-medium ${employeeShiftEnded ? 'text-red-600' : 'text-green-600'}`}>{employeeShiftEnded ? '🏠 You\'re done for today' : '💪 You\'re still active'}</p>
                        {employeeShiftEndTime && (
                          <p className="text-xs text-gray-500 mt-1">You finished at: {moment(employeeShiftEndTime).format('HH:mm')}</p>
                        )}
                      </div>
                    ) : formData.employeeId && !employeeData ? (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-sm text-red-600 font-semibold">Employee ID not found. Please check your ID.</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex space-x-2">
                    {shiftEnded ? (
                      <button
                        onClick={handleStartShift}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {loading ? 'Starting...' : '🌅 Start Fresh'}
                      </button>
                    ) : (
                      <button
                        onClick={handleTimeToGo}
                        disabled={loading || !formData.employeeId || employeeShiftEnded}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {loading ? 'Wrapping up...' : '🏠 Call it a Day'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <form className="space-y-6">
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-semibold text-gray-700 mb-2">
                    Employee ID 🆔
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="employeeId"
                      name="employeeId"
                      type="text"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your Employee ID"
                      disabled={shiftEnded || employeeShiftEnded}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={loading || shiftEnded || employeeShiftEnded}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    {loading ? 'Welcome back...' : '🚀 Start My Day'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckOut}
                    disabled={loading || shiftEnded || employeeShiftEnded}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    {loading ? 'See you soon...' : '👋 End My Day'}
                  </button>
                </div>
              </form>
            </div>

            {/* Friendly Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Quick Guide for Our Team
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">✨</span>
                  <span>Just enter your name or email - whatever you prefer!</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⏰</span>
                  <span>We'll automatically record your time - no stress!</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">☕</span>
                  <span>Running late? No worries - grab a coffee and join us!</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🔄</span>
                  <span>Need to step out and come back? That's totally fine!</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🏠</span>
                  <span>Done for the day? Use "Call it a Day" to wrap up</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🌟</span>
                  <span>Once you're done, take a well-deserved break!</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Today's Team */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Users className="h-6 w-6 mr-3 text-blue-600" />
                  Today's Team
                </h3>
                <button
                  onClick={loadTodayCheckIns}
                  disabled={loadingCheckIns}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
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
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                          {checkIn.employee.profilePicture ? (
                            <img 
                              src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/employees/profile-picture/${checkIn.employee._id}`}
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
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Heart className="h-6 w-6 mr-3 text-red-500" />
                Today's Team Stats
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {todayCheckIns.length}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Team Members</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {todayCheckIns.filter(c => c.isLate).length}
                  </div>
                  <div className="text-sm text-orange-700 font-medium">Coffee Lovers ☕</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl text-center">
                <p className="text-sm text-green-700 font-medium">
                  💪 {todayCheckIns.length > 0 ? 'Amazing team effort today!' : 'Ready to make today amazing!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              {getModalIcon()}
              <h3 className="mt-6 text-2xl font-bold text-gray-900">
                {modalData.title}
              </h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {modalData.message}
              </p>
              
              {modalData.checkInTime && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <p className="text-sm text-green-700 font-medium">
                    <span className="font-bold">Check-in Time:</span> {modalData.checkInTime}
                  </p>
                  {modalData.employee && (
                    <p className="text-sm text-green-700 mt-1">
                      <span className="font-bold">Welcome back:</span> {modalData.employee.name}
                    </p>
                  )}
                </div>
              )}
              
              {modalData.checkOutTime && (
                <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                  <p className="text-sm text-orange-700 font-medium">
                    <span className="font-bold">Check-out Time:</span> {modalData.checkOutTime}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    <span className="font-bold">Hours worked:</span> {modalData.totalHours} hours
                  </p>
                  {modalData.employee && (
                    <p className="text-sm text-orange-700 mt-1">
                      <span className="font-bold">Great work:</span> {modalData.employee.name}
                    </p>
                  )}
                </div>
              )}
              
              <div className="mt-8">
                <button
                  onClick={closeModal}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
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
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Briefcase,
  Clock3,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Star,
  Award,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import moment from 'moment';
import { shiftAPI, uspsGoalsAPI } from '../../services/api';
import GoalMeter from './GoalMeter';

const DashboardTab = ({ employee }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [currentShift, setCurrentShift] = useState(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    totalHours: 0,
    averageHours: 0,
    lateDays: 0,
    onTimeDays: 0
  });
  const [goal, setGoal] = useState(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [goalError, setGoalError] = useState('');

  const calculateStats = useCallback((data) => {
    const totalDays = data.length;
    const presentDays = data.filter(record => record.checkIns.length > 0).length;
    const absentDays = totalDays - presentDays;
    const totalHours = data.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const averageHours = presentDays > 0 ? totalHours / presentDays : 0;
    const lateDays = data.filter(record => record.wasLate).length;
    const onTimeDays = presentDays - lateDays;

    setStats({
      totalDays,
      presentDays,
      absentDays,
      totalHours,
      averageHours,
      lateDays,
      onTimeDays
    });
  }, []);

  const loadAttendanceData = useCallback(async () => {
    if (!employee || !employee._id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('employeeToken');
      const startDate = currentMonth.startOf('month').format('YYYY-MM-DD');
      const endDate = currentMonth.endOf('month').format('YYYY-MM-DD');

      const response = await fetch(`/api/attendance/history/${employee._id}?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [employee, currentMonth, calculateStats]);

  const loadCurrentShift = useCallback(async () => {
    if (!employee || !employee._id) return;
    
    try {
      const response = await shiftAPI.getAll();
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Find current shift for this employee
      const activeShift = response.data.find(shift => 
        shift.isActive && 
        shift.assignedEmployees && 
        shift.assignedEmployees.some(assignment => 
          assignment.employeeId && 
          assignment.employeeId._id === employee._id
        ) &&
        shift.daysOfWeek.includes(currentDay) && 
        currentTime >= shift.startTime && 
        currentTime <= shift.endTime
      );
      
      setCurrentShift(activeShift);
    } catch (error) {
      console.error('Error loading current shift:', error);
    }
  }, [employee]);

  const loadGoal = useCallback(async () => {
    if (!employee || !employee._id) return;
    
    setGoalLoading(true);
    setGoalError('');
    try {
      const response = await uspsGoalsAPI.getCurrentGoal();
      setGoal(response.data || null);
    } catch (err) {
      setGoal(null);
      setGoalError('No active goal for this month.');
    }
    setGoalLoading(false);
  }, [employee]);

  useEffect(() => {
    if (employee && employee._id) {
      loadAttendanceData();
      loadCurrentShift();
      loadGoal();
    }
  }, [employee?._id, currentMonth, loadAttendanceData, loadCurrentShift, loadGoal]);


  const formatChartData = () => {
    return attendanceData.map(record => ({
      date: moment(record.date).format('MMM DD'),
      hours: record.totalHours || 0,
      checkIns: record.checkIns.length,
      checkOuts: record.checkOuts.length,
      wasLate: record.wasLate ? 1 : 0
    }));
  };

  const getAttendanceStatus = () => {
    const today = moment().startOf('day');
    const todayRecord = attendanceData.find(record => 
      moment(record.date).isSame(today)
    );

    if (!todayRecord) {
      return { status: 'Not Checked In', color: 'text-gray-500', icon: Calendar };
    }

    if (todayRecord.shiftEnded) {
      return { status: 'Shift Ended', color: 'text-red-600', icon: CheckCircle };
    }

    if (todayRecord.checkIns.length > 0 && todayRecord.checkOuts.length > 0) {
      return { status: 'Checked Out', color: 'text-blue-600', icon: CheckCircle };
    }

    if (todayRecord.checkIns.length > 0) {
      return { status: 'Checked In', color: 'text-green-600', icon: CheckCircle };
    }

    return { status: 'Not Checked In', color: 'text-gray-500', icon: Calendar };
  };

  const attendanceStatus = getAttendanceStatus();
  const StatusIcon = attendanceStatus.icon;

  // Sample data for charts - replace with real data from your APIs
  const monthlyData = [
    { month: 'Jan', hours: 120, late: 5 },
    { month: 'Feb', hours: 110, late: 3 },
    { month: 'Mar', hours: 130, late: 2 },
    { month: 'Apr', hours: 125, late: 4 },
    { month: 'May', hours: 140, late: 1 },
    { month: 'Jun', hours: 135, late: 2 },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section with Live Stats */}
      <div className="bg-gradient-to-br from-green-900 via-blue-900 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 animate-gradient-text">Welcome, {employee.name}!</h1>
            <p className="text-xl text-green-200">Your Attendance & Performance Dashboard</p>
            <p className="text-sm text-green-300 mt-2">Real-time insights for your work at Ayranest</p>
          </div>
          {/* Live Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-green-400 animate-pulse">{stats.presentDays}</div>
              <div className="text-sm text-green-200">Present Days</div>
              <div className="text-xs text-green-300 mt-1">↗ +2 this month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-blue-400">{stats.totalHours.toFixed(1)}h</div>
              <div className="text-sm text-blue-200">Total Hours</div>
              <div className="text-xs text-blue-300 mt-1">↗ +5h this month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-yellow-400">{stats.lateDays}</div>
              <div className="text-sm text-yellow-200">Late Days</div>
              <div className="text-xs text-yellow-300 mt-1">↘ -1 this month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-purple-400">{stats.averageHours.toFixed(1)}h</div>
              <div className="text-sm text-purple-200">Avg Hours/Day</div>
              <div className="text-xs text-purple-300 mt-1">↗ +0.2h</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather & Time Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">Multan</div>
              <div className="text-sm opacity-90">Punjab, Pakistan</div>
              <div className="text-4xl font-bold mt-2">39°C</div>
              <div className="text-sm opacity-90">Sunny</div>
            </div>
            <div className="text-6xl">☀️</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-pink-600 rounded-3xl p-6 text-white">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">Current Time</div>
            <div className="text-4xl font-mono font-bold mb-2">
              {new Date().toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Karachi'
              })}
            </div>
            <div className="text-sm opacity-90">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Karachi'
              })}
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-teal-600 rounded-3xl p-6 text-white">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">System Status</div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold">All Systems Operational</span>
            </div>
            <div className="text-sm opacity-90">Uptime: 99.9%</div>
            <div className="text-sm opacity-90">Last Updated: 2 min ago</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Hours Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <LineChartIcon className="h-6 w-6 mr-2 text-blue-600" />
            Monthly Working Hours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }} activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="late" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }} activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-purple-600" />
            Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="hours" fill="#3B82F6" />
              <Bar dataKey="late" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border border-yellow-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">🏆 Achievement Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-shadow">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div className="font-semibold text-gray-800">Top Performer</div>
            <div className="text-sm text-gray-600">Attendance Leader</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
            <div className="bg-gradient-to-br from-green-400 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-shadow">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div className="font-semibold text-gray-800">Goal Crusher</div>
            <div className="text-sm text-gray-600">Target Achieved</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-shadow">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="font-semibold text-gray-800">Speed Demon</div>
            <div className="text-sm text-gray-600">No Late Days</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
            <div className="bg-gradient-to-br from-red-400 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-shadow">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div className="font-semibold text-gray-800">Quality Master</div>
            <div className="text-sm text-gray-600">Perfect Attendance</div>
          </div>
        </div>
      </div>

      {/* Monthly Calendar View */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Calendar</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentMonth(prev => prev.clone().subtract(1, 'month'))}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentMonth(moment())}
              className="px-3 py-1 text-sm bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-md transition-colors"
            >
              Current
            </button>
            <button
              onClick={() => setCurrentMonth(prev => prev.clone().add(1, 'month'))}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {(() => {
              const startOfMonth = currentMonth.clone().startOf('month');
              const endOfMonth = currentMonth.clone().endOf('month');
              const startDate = startOfMonth.clone().startOf('week');
              const endDate = endOfMonth.clone().endOf('week');
              const days = [];

              let currentDate = startDate.clone();
              while (currentDate.isSameOrBefore(endDate)) {
                const dayRecord = attendanceData.find(record => 
                  moment(record.date).isSame(currentDate, 'day')
                );

                let dayClass = 'p-2 text-center text-sm border rounded-md';
                let dayContent = currentDate.format('D');

                if (!currentDate.isSame(currentMonth, 'month')) {
                  dayClass += ' text-gray-300';
                } else if (dayRecord) {
                  if (dayRecord.shiftEnded) {
                    dayClass += ' bg-red-50 border-red-200';
                    dayContent = (
                      <div className="flex flex-col items-center">
                        <span>{currentDate.format('D')}</span>
                        <CheckCircle className="h-3 w-3 text-red-500" />
                      </div>
                    );
                  } else if (dayRecord.checkIns.length > 0) {
                    dayClass += dayRecord.wasLate 
                      ? ' bg-yellow-50 border-yellow-200' 
                      : ' bg-green-50 border-green-200';
                    dayContent = (
                      <div className="flex flex-col items-center">
                        <span>{currentDate.format('D')}</span>
                        <Clock3 className="h-3 w-3 text-green-500" />
                      </div>
                    );
                  }
                }

                days.push(
                  <div key={currentDate.format()} className={dayClass}>
                    {dayContent}
                  </div>
                );

                currentDate.add(1, 'day');
              }

              return days;
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Late</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Shift Ended</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab; 
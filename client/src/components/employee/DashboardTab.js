import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  Target
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import moment from 'moment';
import { uspsGoalsAPI } from '../../services/api';
import GoalMeter from './GoalMeter';

const MOTIVATIONAL_QUOTES = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "Your only limit is your mind.",
  "Great things never come from comfort zones.",
  "Push yourself, because no one else is going to do it for you.",
  "Dream it. Wish it. Do it.",
  "Stay positive, work hard, make it happen."
];

const DashboardTab = ({ employee }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(moment());
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
  const [quote, setQuote] = useState('');

  const calculateStats = useCallback((data) => {
    const totalDays = data.length;
    const presentDays = data.filter(record => record.checkIns.length > 0).length;
    const absentDays = totalDays - presentDays;
    const totalHours = data.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const averageHours = presentDays > 0 ? totalHours / presentDays : 0;
    const lateDays = data.filter(record => record.wasLate).length;
    const onTimeDays = presentDays - lateDays;
    setStats({ totalDays, presentDays, absentDays, totalHours, averageHours, lateDays, onTimeDays });
  }, []);

  const loadAttendanceData = useCallback(async () => {
    if (!employee || !employee._id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('employeeToken');
      const startDate = currentMonth.startOf('month').format('YYYY-MM-DD');
      const endDate = currentMonth.endOf('month').format('YYYY-MM-DD');
      const response = await fetch(`/api/attendance/history/${employee._id}?startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      loadGoal();
      setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    }
  }, [employee?._id, currentMonth, loadAttendanceData, loadGoal]);

  useEffect(() => {
    if (attendanceData) {
      console.log('[EmployeeDashboard] attendanceData:', attendanceData);
    }
  }, [attendanceData]);

  // Chart data: attendance trend for the month
  const chartData = attendanceData.map(record => ({
    date: moment(record.date).format('MMM DD'),
    hours: record.totalHours || 0,
    late: record.wasLate ? 1 : 0
  }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 py-10 px-2 md:px-0 transition-all duration-500">
      {/* Hero Card */}
      <div className="w-full max-w-3xl mx-auto relative rounded-3xl shadow-2xl bg-white/60 backdrop-blur-lg border border-gray-200 p-8 flex flex-col items-center gap-6 mb-10 animate-fade-in">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-teal-400 flex items-center justify-center shadow-lg border-4 border-white animate-avatar-pop">
            <User className="h-20 w-20 text-white opacity-90" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full px-4 py-1 text-white text-xs font-semibold shadow-md animate-bounce-in">
            {moment().format('MMMM YYYY')}
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 text-center animate-gradient-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">Welcome, {employee.name}!</h1>
        <p className="text-lg text-gray-700 text-center">Your Performance Dashboard</p>
        <div className="italic text-purple-600 text-center text-base font-medium animate-fade-in-slow">“{quote}”</div>
      </div>

      {/* Key Stats */}
      <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="glass-card group flex flex-col items-center p-6">
          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-3xl font-bold text-green-700 transition-all group-hover:scale-110">{stats.presentDays}</div>
          <div className="text-sm text-gray-700">Present Days</div>
        </div>
        <div className="glass-card group flex flex-col items-center p-6">
          <Clock className="h-8 w-8 text-blue-500 mb-2" />
          <div className="text-3xl font-bold text-blue-700 transition-all group-hover:scale-110">{stats.totalHours.toFixed(1)}h</div>
          <div className="text-sm text-gray-700">Total Hours</div>
        </div>
        <div className="glass-card group flex flex-col items-center p-6">
          <TrendingUp className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-3xl font-bold text-yellow-700 transition-all group-hover:scale-110">{stats.lateDays}</div>
          <div className="text-sm text-gray-700">Late Days</div>
        </div>
        <div className="glass-card group flex flex-col items-center p-6">
          <Calendar className="h-8 w-8 text-purple-500 mb-2" />
          <div className="text-3xl font-bold text-purple-700 transition-all group-hover:scale-110">{stats.averageHours.toFixed(1)}h</div>
          <div className="text-sm text-gray-700">Avg Hours/Day</div>
        </div>
      </div>

      {/* Performance Chart & Goal Meter */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="glass-card p-6 flex flex-col items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
            <Star className="h-6 w-6 mr-2 text-purple-600" /> Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            {attendanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg">No attendance records available for this month.</div>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="hours" stroke="#3B82F6" fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="glass-card flex flex-col items-center justify-center p-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
            <Target className="h-6 w-6 mr-2 text-green-600" /> Monthly Goal
          </h3>
          {goalLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : goal ? (
            <GoalMeter goal={goal} title="" showEdit={false} />
          ) : (
            <div className="text-gray-500 text-center">{goalError || 'No goal set for this month.'}</div>
          )}
        </div>
      </div>

      {/* Daily Tip */}
      <div className="w-full max-w-3xl mx-auto mt-6">
        <div className="glass-card p-4 flex items-center justify-center text-teal-700 text-base font-semibold shadow-md animate-fade-in-slow">
          💡 Tip: Stay consistent and track your progress every day!
        </div>
      </div>
    </div>
  );
};

// Glassmorphism card utility class
// Add this to your global CSS (index.css or tailwind.config.js):
// .glass-card { @apply bg-white/60 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl; }
// .animate-fade-in { animation: fadeIn 0.8s ease; }
// .animate-fade-in-slow { animation: fadeIn 1.5s ease; }
// .animate-gradient-text { background-size: 200% 200%; animation: gradientMove 3s ease infinite; }
// .animate-avatar-pop { animation: popIn 0.7s cubic-bezier(.68,-0.55,.27,1.55); }
// .animate-bounce-in { animation: bounceIn 1s cubic-bezier(.68,-0.55,.27,1.55); }
//
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
// @keyframes gradientMove { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
// @keyframes popIn { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
// @keyframes bounceIn { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }

export default DashboardTab; 
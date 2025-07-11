import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle,
  BarChart3,
  AlertTriangle,
  Target,
  Star
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import moment from 'moment';
import { shiftAPI, uspsGoalsAPI } from '../../services/api';
import GoalMeter from './GoalMeter';

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
    }
  }, [employee?._id, currentMonth, loadAttendanceData, loadGoal]);

  useEffect(() => {
    // Debug: log attendanceData
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
    <div className="space-y-10">
      {/* Hero Card */}
      <div className="relative bg-white/60 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center gap-8 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl">
        <div className="flex-shrink-0">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg border-4 border-white">
            <Star className="h-16 w-16 text-white opacity-80" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 animate-gradient-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">Welcome, {employee.name}!</h1>
          <p className="text-lg text-gray-700 mb-1">Your Performance Dashboard</p>
          <p className="text-sm text-gray-500">Track your attendance, hours, and goals in real time.</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-card group">
          <div className="text-2xl font-bold text-green-700 transition-all group-hover:scale-110">{stats.presentDays}</div>
          <div className="text-sm text-gray-700">Present Days</div>
        </div>
        <div className="glass-card group">
          <div className="text-2xl font-bold text-blue-700 transition-all group-hover:scale-110">{stats.totalHours.toFixed(1)}h</div>
          <div className="text-sm text-gray-700">Total Hours</div>
        </div>
        <div className="glass-card group">
          <div className="text-2xl font-bold text-yellow-700 transition-all group-hover:scale-110">{stats.lateDays}</div>
          <div className="text-sm text-gray-700">Late Days</div>
        </div>
        <div className="glass-card group">
          <div className="text-2xl font-bold text-purple-700 transition-all group-hover:scale-110">{stats.averageHours.toFixed(1)}h</div>
          <div className="text-sm text-gray-700">Avg Hours/Day</div>
        </div>
      </div>

      {/* Performance Chart & Goal Meter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
            <BarChart3 className="h-6 w-6 mr-2 text-purple-600" /> Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            {attendanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg">No attendance records available for this month.</div>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', r: 5 }} activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2 }} />
              </LineChart>
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
    </div>
  );
};

// Glassmorphism card utility class
// Add this to your global CSS (index.css or tailwind.config.js):
// .glass-card { @apply bg-white/60 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl; }

export default DashboardTab; 
import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import moment from 'moment';
import { uspsGoalsAPI } from '../../services/api';
import GoalMeter from './GoalMeter';

const AURA_QUOTES = [
  "Your energy is your superpower.",
  "Shine bright—your aura inspires others!",
  "Every day is a new chance to glow.",
  "You radiate positivity and strength.",
  "Let your aura lead the way!",
  "Your presence lights up the room."
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
      setQuote(AURA_QUOTES[Math.floor(Math.random() * AURA_QUOTES.length)]);
    }
  }, [employee?._id, currentMonth, loadAttendanceData, loadGoal]);

  // Chart data: attendance trend for the month
  const chartData = attendanceData.map(record => ({
    date: moment(record.date).format('MMM DD'),
    hours: record.totalHours || 0
  }));

  return (
    <div className="aura-bg min-h-screen flex flex-col items-center justify-start py-10 px-2 md:px-0 transition-all duration-500">
      {/* Aura Hero Card */}
      <div className="w-full max-w-3xl mx-auto relative rounded-3xl shadow-2xl aura-glass p-8 flex flex-col items-center gap-6 mb-10 animate-fade-in">
        <div className="relative flex flex-col items-center">
          <div className="aura-avatar-glow">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-teal-400 flex items-center justify-center shadow-lg border-4 border-white animate-avatar-pop">
              <User className="h-20 w-20 text-white opacity-90" />
            </div>
            <div className="aura-ring"></div>
          </div>
          <h1 className="text-4xl font-extrabold text-center aura-gradient-text mt-4">Welcome, {employee.name}!</h1>
          <div className="italic text-aura-affirmation text-center text-base font-medium animate-fade-in-slow mt-2">“{quote}”</div>
        </div>
      </div>

      {/* Aura Stats Row */}
      <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="aura-card group flex flex-col items-center p-6">
          <CheckCircle className="h-8 w-8 text-green-400 mb-2 aura-glow" />
          <div className="text-3xl font-bold text-green-700 aura-animated-number">{stats.presentDays}</div>
          <div className="text-sm text-gray-700">Present</div>
        </div>
        <div className="aura-card group flex flex-col items-center p-6">
          <Clock className="h-8 w-8 text-blue-400 mb-2 aura-glow" />
          <div className="text-3xl font-bold text-blue-700 aura-animated-number">{stats.totalHours.toFixed(1)}h</div>
          <div className="text-sm text-gray-700">Total Hours</div>
        </div>
        <div className="aura-card group flex flex-col items-center p-6">
          <TrendingUp className="h-8 w-8 text-yellow-400 mb-2 aura-glow" />
          <div className="text-3xl font-bold text-yellow-700 aura-animated-number">{stats.lateDays}</div>
          <div className="text-sm text-gray-700">Late</div>
        </div>
        <div className="aura-card group flex flex-col items-center p-6">
          <Calendar className="h-8 w-8 text-purple-400 mb-2 aura-glow" />
          <div className="text-3xl font-bold text-purple-700 aura-animated-number">{stats.averageHours.toFixed(1)}h</div>
          <div className="text-sm text-gray-700">Avg/Day</div>
        </div>
      </div>

      {/* Aura Performance Chart & Goal */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="aura-card p-6 flex flex-col items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4 aura-gradient-text">
            Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            {attendanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg">No attendance records available for this month.</div>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="auraColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7f5af0" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2cb67d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="hours" stroke="#7f5af0" fillOpacity={1} fill="url(#auraColor)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="aura-card flex flex-col items-center justify-center p-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4 aura-gradient-text">
            Monthly Goal
          </h3>
          {goalLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            </div>
          ) : goal ? (
            <GoalMeter goal={goal} title="" showEdit={false} aura />
          ) : (
            <div className="text-gray-500 text-center">{goalError || 'No goal set for this month.'}</div>
          )}
        </div>
      </div>

      {/* Aura Daily Affirmation */}
      <div className="w-full max-w-3xl mx-auto mt-6">
        <div className="aura-card p-4 flex items-center justify-center text-aura-affirmation text-base font-semibold shadow-md animate-fade-in-slow">
          ✨ {quote}
        </div>
      </div>
    </div>
  );
};

// Aura CSS utility classes (add to index.css or Tailwind config):
// .aura-bg { background: linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 50%, #d1fae5 100%); position: relative; overflow: hidden; }
// .aura-glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(16px); border-radius: 2rem; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18); }
// .aura-card { background: rgba(255,255,255,0.6); border-radius: 1.5rem; box-shadow: 0 4px 24px 0 rgba(127,90,240,0.08); transition: box-shadow 0.3s; }
// .aura-card:hover { box-shadow: 0 8px 32px 0 rgba(44,182,125,0.15); }
// .aura-gradient-text { background: linear-gradient(90deg, #7f5af0, #2cb67d, #f5f3ff); background-clip: text; -webkit-background-clip: text; color: transparent; animation: auraGradientMove 4s ease-in-out infinite alternate; }
// .aura-avatar-glow { position: relative; display: flex; align-items: center; justify-content: center; }
// .aura-ring { position: absolute; top: -12px; left: -12px; width: 128px; height: 128px; border-radius: 50%; background: conic-gradient(from 0deg, #7f5af0, #2cb67d, #f5f3ff, #7f5af0); filter: blur(12px); opacity: 0.7; animation: auraRingSpin 6s linear infinite; z-index: 0; }
// .aura-glow { filter: drop-shadow(0 0 8px #7f5af0aa); }
// .aura-animated-number { transition: color 0.3s, transform 0.3s; }
// .aura-animated-number:hover { color: #2cb67d; transform: scale(1.1); }
// .text-aura-affirmation { color: #7f5af0; }
// @keyframes auraGradientMove { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
// @keyframes auraRingSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
// .animate-fade-in { animation: fadeIn 0.8s ease; }
// .animate-fade-in-slow { animation: fadeIn 1.5s ease; }
// .animate-avatar-pop { animation: popIn 0.7s cubic-bezier(.68,-0.55,.27,1.55); }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
// @keyframes popIn { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

export default DashboardTab; 
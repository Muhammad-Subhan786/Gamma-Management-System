import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardList,
  Home,
  DollarSign,
  Users as UsersIcon,
  XCircle,
  Sparkles,
  Mail,
  Phone
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import moment from 'moment';
import { uspsGoalsAPI, uspsLabelsAPI, tasksAPI, shiftAPI, ordersAPI } from '../../services/api';
import GoalMeter from './GoalMeter';
import { employeeAPI } from '../../services/api';

const COLORS = ['#3b82f6', '#f59e42', '#e5e7eb'];

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

  // USPS Labels state
  const [labelsDashboard, setLabelsDashboard] = useState({
    totalLabels: 0,
    totalRevenue: 0,
    averageRate: 0,
    totalCustomers: 0,
    pendingLabels: 0,
    paidLabels: 0,
    completedLabels: 0
  });
  const [labels, setLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(true);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Shifts state
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState(null);
  const [nextShift, setNextShift] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Salary state
  const [salary, setSalary] = useState({ basicSalary: 0, bonuses: [], totalSalary: 0 });
  const [salaryLoading, setSalaryLoading] = useState(true);

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

  // Fetch USPS Labels dashboard and list
  useEffect(() => {
    const fetchLabels = async () => {
      setLabelsLoading(true);
      try {
        const [dashboardRes, labelsRes] = await Promise.all([
          uspsLabelsAPI.getMyDashboard(),
          uspsLabelsAPI.getMyLabels()
        ]);
        setLabelsDashboard(dashboardRes.data || {});
        setLabels(labelsRes.data || []);
      } catch (err) {
        setLabelsDashboard({
          totalLabels: 0,
          totalRevenue: 0,
          averageRate: 0,
          totalCustomers: 0,
          pendingLabels: 0,
          paidLabels: 0,
          completedLabels: 0
        });
        setLabels([]);
      } finally {
        setLabelsLoading(false);
      }
    };
    fetchLabels();
  }, [employee?._id]);

  useEffect(() => {
    if (employee && employee._id) {
      loadAttendanceData();
      loadGoal();
    }
  }, [employee?._id, currentMonth, loadAttendanceData, loadGoal]);

  useEffect(() => {
    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const { data } = await tasksAPI.getAll();
        setTasks(data.filter(t => t.assignedTo && t.assignedTo._id === employee._id));
      } catch {
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };
    if (employee && employee._id) fetchTasks();
  }, [employee?._id]);

  useEffect(() => {
    const fetchShifts = async () => {
      setShiftsLoading(true);
      try {
        const response = await shiftAPI.getAll();
        const employeeShifts = response.data.filter(shift =>
          shift.assignedEmployees &&
          shift.assignedEmployees.some(assignment =>
            assignment.employeeId && assignment.employeeId._id === employee._id
          )
        );
        setAssignedShifts(employeeShifts);
        // Find current shift
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const activeShift = employeeShifts.find(shift =>
          shift.isActive &&
          shift.daysOfWeek.includes(currentDay) &&
          currentTime >= shift.startTime &&
          currentTime <= shift.endTime
        );
        setCurrentShift(activeShift);
        // Find next shift
        // Today
        const todayShifts = employeeShifts.filter(shift =>
          shift.isActive && shift.daysOfWeek.includes(currentDay)
        );
        const nextShiftToday = todayShifts.find(shift => shift.startTime > currentTime);
        if (nextShiftToday) setNextShift(nextShiftToday);
        else {
          // Upcoming days
          const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const currentDayIndex = daysOfWeek.indexOf(currentDay);
          let found = null;
          for (let i = 1; i <= 7; i++) {
            const checkDayIndex = (currentDayIndex + i) % 7;
            const checkDay = daysOfWeek[checkDayIndex];
            const shiftsOnDay = employeeShifts.filter(shift =>
              shift.isActive && shift.daysOfWeek.includes(checkDay)
            );
            if (shiftsOnDay.length > 0) {
              found = { ...shiftsOnDay[0], nextDay: checkDay };
              break;
            }
          }
          setNextShift(found);
        }
      } catch {
        setAssignedShifts([]);
        setCurrentShift(null);
        setNextShift(null);
      } finally {
        setShiftsLoading(false);
      }
    };
    if (employee && employee._id) fetchShifts();
  }, [employee?._id]);

  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const { data } = await ordersAPI.getAll();
        // If orders have an assignedTo or employeeId field, filter for this employee
        const filtered = data.orders
          ? data.orders.filter(o => o.employeeId === employee._id || o.assignedTo === employee._id)
          : [];
        setOrders(filtered.length > 0 ? filtered : (data.orders || []));
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    if (employee && employee._id) fetchOrders();
  }, [employee?._id]);

  useEffect(() => {
    const fetchSalary = async () => {
      setSalaryLoading(true);
      try {
        // Try to fetch salary breakdown if endpoint exists
        if (employee && employee._id) {
          const { data } = await employeeAPI.getProfile();
          if (employeeAPI.getSalaryBreakdown) {
            const breakdown = await employeeAPI.getSalaryBreakdown();
            setSalary(breakdown.data || { basicSalary: data.salary || 0, bonuses: [], totalSalary: data.salary || 0 });
          } else {
            setSalary({ basicSalary: data.salary || 0, bonuses: [], totalSalary: data.salary || 0 });
          }
        }
      } catch {
        setSalary({ basicSalary: employee.salary || 0, bonuses: [], totalSalary: employee.salary || 0 });
      } finally {
        setSalaryLoading(false);
      }
    };
    fetchSalary();
  }, [employee?._id]);

  // Chart data: attendance trend for the month
  const chartData = attendanceData.map(record => ({
    date: moment(record.date).format('MMM DD'),
    checkIns: record.checkIns.length,
    hours: record.totalHours || 0
  }));

  // Pie chart data for performance
  const pieData = [
    { name: 'On Time', value: stats.onTimeDays },
    { name: 'Late', value: stats.lateDays },
    { name: 'Absent', value: stats.absentDays }
  ];

  // Pie chart for label status
  const labelStatusPie = [
    { name: 'Pending', value: labelsDashboard.pendingLabels || 0 },
    { name: 'Paid', value: labelsDashboard.paidLabels || 0 },
    { name: 'Completed', value: labelsDashboard.completedLabels || 0 }
  ];
  // Trend chart for labels/revenue over time (by month)
  const labelTrend = (() => {
    const byMonth = {};
    labels.forEach(label => {
      const d = new Date(label.entryDate || label.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { month: key, labels: 0, revenue: 0 };
      byMonth[key].labels += Number(label.totalLabels || 0);
      byMonth[key].revenue += Number(label.totalRevenue || 0);
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  })();

  // Task stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'complete').length;
  const pendingTasks = tasks.filter(t => t.status === 'tasks').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => t.due && new Date(t.due) < new Date() && t.status !== 'complete').length;
  // Pie chart for task status
  const taskStatusPie = [
    { name: 'Pending', value: pendingTasks },
    { name: 'Done', value: doneTasks },
    { name: 'Complete', value: completedTasks }
  ];
  // Top 3 urgent tasks (nearest due, not complete)
  const urgentTasks = tasks
    .filter(t => t.status !== 'complete' && t.due)
    .sort((a, b) => new Date(a.due) - new Date(b.due))
    .slice(0, 3);

  // Shift stats
  const totalAssigned = assignedShifts.length;
  const activeShifts = assignedShifts.filter(s => s.isActive).length;
  const upcomingShifts = assignedShifts.filter(s => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    return s.isActive && s.daysOfWeek.includes(currentDay) && s.startTime > now.toTimeString().slice(0, 5);
  }).length;
  const missedShifts = assignedShifts.filter(s => !s.isActive).length;

  // Order stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  // Pie chart for order status
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const orderStatusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Calculate present streaks
  const getPresentStreak = () => {
    let streak = 0;
    for (let i = attendanceData.length - 1; i >= 0; i--) {
      if (attendanceData[i].checkIns.length > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };
  const presentStreak = getPresentStreak();

  // Calculate longest present streak
  const getLongestPresentStreak = () => {
    let maxStreak = 0, current = 0;
    for (let i = 0; i < attendanceData.length; i++) {
      if (attendanceData[i].checkIns.length > 0) {
        current++;
        if (current > maxStreak) maxStreak = current;
      } else {
        current = 0;
      }
    }
    return maxStreak;
  };
  const longestPresentStreak = getLongestPresentStreak();

  // Quick actions (customize as needed)
  const quickActions = [
    { label: 'Check In/Out', icon: Clock, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'My Shifts', icon: Calendar, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'My Tasks', icon: ClipboardList, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'My Labels', icon: Home, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center shadow-lg border-4 border-white">
              <User className="h-12 w-12 text-white opacity-90" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1 flex items-center">
                Welcome, {employee.name}
              </h2>
              <p className="text-blue-100 text-lg">Here’s your performance snapshot for {moment().format('MMMM YYYY')}</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex gap-2">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="group bg-white/90 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1 flex flex-col items-center"
                  >
                    <Icon className="h-6 w-6 text-blue-600 group-hover:text-purple-600 mb-1" />
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* USPS Labels Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-green-500" /> USPS Labels Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <BarChart3 className="h-7 w-7 text-blue-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{labelsDashboard.totalLabels}</div>
              <div className="text-sm text-blue-800 font-medium">Total Labels</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <DollarSign className="h-7 w-7 text-green-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-green-700">${labelsDashboard.totalRevenue?.toLocaleString()}</div>
              <div className="text-sm text-green-800 font-medium">Total Revenue</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <DollarSign className="h-7 w-7 text-purple-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-purple-700">${labelsDashboard.averageRate?.toFixed(2)}</div>
              <div className="text-sm text-purple-800 font-medium">Average Rate</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <UsersIcon className="h-7 w-7 text-yellow-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{labelsDashboard.totalCustomers}</div>
              <div className="text-sm text-yellow-800 font-medium">Unique Customers</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-green-600" /> Label Status Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={labelStatusPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {['#f59e42', '#3b82f6', '#10b981'].map((color, idx) => (
                    <Cell key={color} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" /> Labels & Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={labelTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="labels" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Labels" />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attendance & Performance Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle className="h-7 w-7 text-blue-500" /> Attendance & Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <CheckCircle className="h-7 w-7 text-green-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-green-700">{stats.presentDays}</div>
              <div className="text-sm text-green-800 font-medium">Present Days</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <XCircle className="h-7 w-7 text-red-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-red-700">{stats.absentDays}</div>
              <div className="text-sm text-red-800 font-medium">Absent Days</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <TrendingUp className="h-7 w-7 text-yellow-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{stats.lateDays}</div>
              <div className="text-sm text-yellow-800 font-medium">Late Days</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <CheckCircle className="h-7 w-7 text-blue-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{stats.onTimeDays}</div>
              <div className="text-sm text-blue-800 font-medium">On Time Days</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <Clock className="h-7 w-7 text-purple-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-purple-700">{stats.totalHours.toFixed(1)}h</div>
              <div className="text-sm text-purple-800 font-medium">Total Hours</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <Calendar className="h-7 w-7 text-indigo-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-indigo-700">{stats.averageHours.toFixed(1)}h</div>
              <div className="text-sm text-indigo-800 font-medium">Avg. Hours/Day</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-pink-500" /> Streaks
            </h3>
            <div className="flex flex-col items-center gap-2">
              <div className="text-2xl font-bold text-blue-700">Current Present Streak: {presentStreak} days</div>
              <div className="text-lg text-gray-600">Longest Present Streak: {longestPresentStreak} days</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" /> Performance
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-purple-500" /> My Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <ClipboardList className="h-7 w-7 text-blue-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{totalTasks}</div>
              <div className="text-sm text-blue-800 font-medium">Total Tasks</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <CheckCircle className="h-7 w-7 text-green-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-green-700">{completedTasks}</div>
              <div className="text-sm text-green-800 font-medium">Completed</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <TrendingUp className="h-7 w-7 text-yellow-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{pendingTasks}</div>
              <div className="text-sm text-yellow-800 font-medium">Pending</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <XCircle className="h-7 w-7 text-red-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-red-700">{overdueTasks}</div>
              <div className="text-sm text-red-800 font-medium">Overdue</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" /> Task Status Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={taskStatusPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {['#f59e42', '#3b82f6', '#10b981'].map((color, idx) => (
                    <Cell key={color} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-yellow-600" /> Top Urgent Tasks
            </h3>
            <ul className="divide-y divide-gray-200">
              {urgentTasks.length === 0 && (
                <li className="py-2 text-gray-400">No urgent tasks 🎉</li>
              )}
              {urgentTasks.map(task => (
                <li key={task._id} className="py-2 flex flex-col">
                  <span className="font-semibold text-gray-900">{task.title}</span>
                  <span className="text-xs text-gray-500">Due: {task.due ? new Date(task.due).toLocaleString() : 'No deadline'}</span>
                  <span className="text-xs text-gray-500">Status: {task.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Shifts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-7 w-7 text-blue-500" /> My Shifts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <Calendar className="h-7 w-7 text-blue-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{totalAssigned}</div>
              <div className="text-sm text-blue-800 font-medium">Total Assigned</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <CheckCircle className="h-7 w-7 text-green-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-green-700">{activeShifts}</div>
              <div className="text-sm text-green-800 font-medium">Active</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <TrendingUp className="h-7 w-7 text-yellow-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{upcomingShifts}</div>
              <div className="text-sm text-yellow-800 font-medium">Upcoming</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <XCircle className="h-7 w-7 text-red-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-red-700">{missedShifts}</div>
              <div className="text-sm text-red-800 font-medium">Missed</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" /> Current Shift
            </h3>
            {currentShift ? (
              <div>
                <div className="font-bold text-lg text-blue-700">{currentShift.name}</div>
                <div className="text-gray-600">{currentShift.startTime} - {currentShift.endTime}</div>
                <div className="text-gray-500 text-sm">{currentShift.department}</div>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Active Now</div>
              </div>
            ) : (
              <div className="text-gray-400">No current shift</div>
            )}
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" /> Next Shift
            </h3>
            {nextShift ? (
              <div>
                <div className="font-bold text-lg text-blue-700">{nextShift.name}</div>
                <div className="text-gray-600">{nextShift.startTime} - {nextShift.endTime}</div>
                <div className="text-gray-500 text-sm">{nextShift.department}{nextShift.nextDay ? ` (${nextShift.nextDay})` : ''}</div>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Upcoming</div>
              </div>
            ) : (
              <div className="text-gray-400">No upcoming shift</div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-green-500" /> My Orders
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <BarChart3 className="h-7 w-7 text-blue-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{totalOrders}</div>
              <div className="text-sm text-blue-800 font-medium">Total Orders</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <DollarSign className="h-7 w-7 text-green-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-green-700">${totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-green-800 font-medium">Total Revenue</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
            <TrendingUp className="h-7 w-7 text-yellow-600 mr-4" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">${avgOrderValue.toFixed(2)}</div>
              <div className="text-sm text-yellow-800 font-medium">Avg. Order Value</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 max-w-lg mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2 text-green-600" /> Order Status Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={orderStatusPie}
                cx="50%"
                cy="50%"
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {['#f59e42', '#3b82f6', '#10b981', '#ef4444', '#a78bfa'].map((color, idx) => (
                  <Cell key={color} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profile & Salary Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-7 w-7 text-blue-500" /> My Profile & Salary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center shadow-lg border-4 border-white mb-4">
              {employee.profilePicture ? (
                <img src={`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/api/employees/profile-picture/${employee._id}`} alt={employee.name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">{employee.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">{employee.name}</div>
            <div className="text-sm text-gray-600 mb-1">{employee.position} {employee.department ? `- ${employee.department}` : ''}</div>
            <div className="text-xs text-gray-400 mb-2">Joined: {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}</div>
            <div className="flex flex-col items-center gap-1 mt-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm"><Mail className="h-4 w-4" /> {employee.email}</div>
              <div className="flex items-center gap-2 text-gray-500 text-sm"><Phone className="h-4 w-4" /> {employee.phone || 'Not provided'}</div>
            </div>
          </div>
          {/* Salary Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" /> Salary Breakdown
            </h3>
            {salaryLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Base Salary</span>
                  <span className="text-blue-700 font-bold">{salary.basicSalary.toLocaleString()} PKR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Bonuses</span>
                  <span className="text-green-700 font-bold">{salary.bonuses && salary.bonuses.length > 0 ? salary.bonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString() : '0'} PKR</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 mt-2">
                  <span className="text-gray-900 font-semibold">Total Salary</span>
                  <span className="text-purple-700 font-bold text-lg">{salary.totalSalary.toLocaleString()} PKR</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.presentDays}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lateDays}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Hours/Day</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            {attendanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg">No attendance records available for this month.</div>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" />
            Performance
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goal Progress */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex flex-col items-center mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-green-600" />
          Monthly Goal
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
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  CalendarDays,
  Clock3,
  Briefcase
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

  useEffect(() => {
    if (employee && employee._id) {
      loadAttendanceData();
      loadCurrentShift();
      loadGoal();
    }
  }, [employee?._id, currentMonth]);

  const loadAttendanceData = async () => {
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
  };

  const loadCurrentShift = async () => {
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
  };

  const loadGoal = async () => {
    if (!employee || !employee._id) return;
    
    setGoalLoading(true);
    setGoalError('');
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await uspsGoalsAPI.getCurrentGoal();
      setGoal(response.data || null);
    } catch (err) {
      setGoal(null);
      setGoalError('No active goal for this month.');
    }
    setGoalLoading(false);
  };

  const calculateStats = (data) => {
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
  };

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {employee.name}!</h2>
            <p className="text-gray-600">Here's your attendance overview for {currentMonth.format('MMMM YYYY')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon className={`h-5 w-5 ${attendanceStatus.color}`} />
            <span className={`font-medium ${attendanceStatus.color}`}>
              {attendanceStatus.status}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Goal Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Monthly Goal</h3>
        {goalLoading ? (
          <div className="text-gray-400">Loading goal...</div>
        ) : goal ? (
          <GoalMeter goal={goal} />
        ) : (
          <div className="text-gray-400">{goalError}</div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.presentDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lateDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Shift Card */}
      {currentShift && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: currentShift.color }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Currently Working</h3>
                <p className="text-gray-600">{currentShift.name} - {currentShift.startTime} to {currentShift.endTime}</p>
                <p className="text-sm text-gray-500">{currentShift.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Shift Status</div>
              <div className="text-lg font-semibold text-green-600">Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Hours This Month</h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend</h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="checkIns" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="checkOuts" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
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
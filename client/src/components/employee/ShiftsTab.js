import React, { useState, useEffect, useCallback } from 'react';
import { shiftAPI } from '../../services/api';
import { 
  Clock, 
  Calendar, 
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import moment from 'moment';

const ShiftsTab = ({ employee }) => {
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);

  const loadAssignedShifts = useCallback(async () => {
    if (!employee || !employee._id) return;
    
    setLoading(true);
    try {
      const response = await shiftAPI.getAll();
      // Filter shifts where this employee is assigned
      const employeeShifts = response.data.filter(shift => 
        shift.assignedEmployees && 
        shift.assignedEmployees.some(assignment => 
          assignment.employeeId && 
          assignment.employeeId._id === employee._id
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
    } catch (error) {
      console.error('Error loading assigned shifts:', error);
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    if (employee && employee._id) {
      loadAssignedShifts();
    }
  }, [employee?._id, loadAssignedShifts]);

  const getShiftStatus = (shift) => {
    if (!shift.isActive) return { status: 'inactive', text: 'Inactive', icon: <XCircle className="h-4 w-4 text-red-500" /> };
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (shift.daysOfWeek.includes(currentDay)) {
      if (currentTime >= shift.startTime && currentTime <= shift.endTime) {
        return { status: 'active', text: 'Active Now', icon: <CheckCircle className="h-4 w-4 text-green-500" /> };
      } else if (currentTime < shift.startTime) {
        return { status: 'upcoming', text: 'Upcoming Today', icon: <Clock className="h-4 w-4 text-blue-500" /> };
      } else {
        return { status: 'ended', text: 'Ended Today', icon: <XCircle className="h-4 w-4 text-gray-500" /> };
      }
    } else {
      return { status: 'scheduled', text: 'Scheduled', icon: <Calendar className="h-4 w-4 text-gray-500" /> };
    }
  };

  const getNextShift = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Find next shift today
    const todayShifts = assignedShifts.filter(shift => 
      shift.isActive && shift.daysOfWeek.includes(currentDay)
    );
    
    const nextShiftToday = todayShifts.find(shift => shift.startTime > currentTime);
    if (nextShiftToday) return nextShiftToday;
    
    // Find next shift in upcoming days
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayIndex = daysOfWeek.indexOf(currentDay);
    
    for (let i = 1; i <= 7; i++) {
      const checkDayIndex = (currentDayIndex + i) % 7;
      const checkDay = daysOfWeek[checkDayIndex];
      
      const shiftsOnDay = assignedShifts.filter(shift => 
        shift.isActive && shift.daysOfWeek.includes(checkDay)
      );
      
      if (shiftsOnDay.length > 0) {
        return { ...shiftsOnDay[0], nextDay: checkDay };
      }
    }
    
    return null;
  };

  const nextShift = getNextShift();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Shifts</h2>
        <p className="text-gray-600">View your assigned work shifts and schedule</p>
      </div>

      {/* Current Shift Status */}
      {currentShift && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Currently Working</h3>
              <p className="text-green-700">{currentShift.name} - {currentShift.startTime} to {currentShift.endTime}</p>
            </div>
          </div>
        </div>
      )}

      {/* Next Shift */}
      {nextShift && !currentShift && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Next Shift</h3>
              <p className="text-blue-700">
                {nextShift.name} - {nextShift.startTime} to {nextShift.endTime}
                {nextShift.nextDay && ` (${nextShift.nextDay})`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Shifts Assigned */}
      {assignedShifts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">No Shifts Assigned</h3>
              <p className="text-yellow-700">You haven't been assigned to any shifts yet. Contact your manager.</p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Shifts Grid */}
      {assignedShifts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedShifts.map((shift) => {
            const status = getShiftStatus(shift);
            return (
              <div key={shift._id} className="bg-white rounded-lg shadow-md p-6 border-l-4" 
                   style={{ borderLeftColor: shift.color }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {status.icon}
                    <div className="ml-2">
                      <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                      <p className="text-sm text-gray-500">{status.text}</p>
                    </div>
                  </div>
                </div>

                {shift.description && (
                  <p className="text-sm text-gray-600 mb-3">{shift.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{shift.startTime} - {shift.endTime}</span>
                    <span className="text-gray-500 ml-2">({shift.workingHours}h)</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{shift.daysOfWeek.join(', ')}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {shift.assignedEmployees.length} employee{shift.assignedEmployees.length !== 1 ? 's' : ''} assigned
                    </span>
                  </div>
                </div>

                {/* Shift Status Badge */}
                <div className="mt-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status.status === 'active' ? 'bg-green-100 text-green-800' :
                    status.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    status.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                    status.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {status.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly Schedule */}
      {assignedShifts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const dayShifts = assignedShifts.filter(shift => 
                shift.isActive && shift.daysOfWeek.includes(day === 'Mon' ? 'Monday' : 
                                                          day === 'Tue' ? 'Tuesday' :
                                                          day === 'Wed' ? 'Wednesday' :
                                                          day === 'Thu' ? 'Thursday' :
                                                          day === 'Fri' ? 'Friday' :
                                                          day === 'Sat' ? 'Saturday' : 'Sunday')
              );
              
              return (
                <div key={day} className="text-center">
                  <div className="text-sm font-medium text-gray-500 mb-2">{day}</div>
                  {dayShifts.map((shift) => (
                    <div key={shift._id} className="text-xs p-1 rounded mb-1" 
                         style={{ backgroundColor: shift.color + '20', color: shift.color }}>
                      {shift.name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftsTab; 
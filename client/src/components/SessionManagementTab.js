import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  RefreshCw,
  Shield,
  Zap,
  XCircle
} from 'lucide-react';

const SessionManagementTab = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Define available sessions
  const sessions = [
    {
      id: 'usps_labels',
      name: 'USPS Labels',
      description: 'Manage USPS label orders and customer data',
      icon: DollarSign,
      color: 'blue'
    },
    {
      id: 'tasks',
      name: 'Tasks',
      description: 'Manage and track tasks in a Trello-style board',
      icon: CheckCircle,
      color: 'purple'
    },
    {
      id: 'aura_nest',
      name: 'Aura Nest',
      description: 'Financial, inventory, and order management',
      icon: DollarSign,
      color: 'purple'
    }
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionToggle = async (employeeId, sessionId) => {
    setSaving(true);
    try {
      // Find the employee
      const employee = employees.find(emp => emp._id === employeeId);
      if (!employee) return;

      // Toggle the session access
      const updatedSessions = employee.allowedSessions || [];
      const sessionIndex = updatedSessions.indexOf(sessionId);
      
      if (sessionIndex > -1) {
        // Remove session access
        updatedSessions.splice(sessionIndex, 1);
      } else {
        // Add session access
        updatedSessions.push(sessionId);
      }

      // Update employee with new session permissions
      await employeeAPI.update(employeeId, {
        ...employee,
        allowedSessions: updatedSessions
      });

      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp._id === employeeId 
          ? { ...emp, allowedSessions: updatedSessions }
          : emp
      ));

    } catch (error) {
      console.error('Error updating session access:', error);
      alert('Failed to update session access. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async (sessionId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} ${sessionId} access for all employees?`)) {
      return;
    }

    setSaving(true);
    try {
      const updatedEmployees = employees.map(employee => {
        const currentSessions = employee.allowedSessions || [];
        let newSessions;

        if (action === 'grant') {
          newSessions = currentSessions.includes(sessionId) 
            ? currentSessions 
            : [...currentSessions, sessionId];
        } else {
          newSessions = currentSessions.filter(s => s !== sessionId);
        }

        return { ...employee, allowedSessions: newSessions };
      });

      // Update all employees
      await Promise.all(
        updatedEmployees.map(emp => 
          employeeAPI.update(emp._id, emp)
        )
      );

      setEmployees(updatedEmployees);
      alert(`Successfully ${action}ed ${sessionId} access for all employees!`);

    } catch (error) {
      console.error('Error bulk updating sessions:', error);
      alert('Failed to update session access. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );



  const hasSessionAccess = (employee, sessionId) => {
    return (employee.allowedSessions || []).includes(sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-blue-600" />
              Session Management
            </h2>
            <p className="text-gray-600 mt-1">
              Control which employees have access to different system sessions
            </p>
          </div>
          <button
            onClick={loadEmployees}
            disabled={loading}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sessions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map(session => {
          const IconComponent = session.icon;
          const employeesWithAccess = employees.filter(emp => 
            hasSessionAccess(emp, session.id)
          ).length;
          
          return (
            <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 bg-${session.color}-100 rounded-lg mr-3`}>
                    <IconComponent className={`h-6 w-6 text-${session.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                    <p className="text-sm text-gray-600">{session.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{employeesWithAccess}</div>
                  <div className="text-sm text-gray-600">employees</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkUpdate(session.id, 'grant')}
                  disabled={saving}
                  className={`btn-primary flex-1 flex items-center justify-center text-sm`}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Grant All
                </button>
                <button
                  onClick={() => handleBulkUpdate(session.id, 'revoke')}
                  disabled={saving}
                  className="btn-danger flex-1 flex items-center justify-center text-sm"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Revoke All
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Employee Session Access</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                {sessions.map(session => (
                  <th key={session.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {session.name}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map(employee => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {employee.profilePicture ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={`/api/employees/profile-picture/${employee._id}`}
                            alt={employee.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  {sessions.map(session => (
                    <td key={session.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleSessionToggle(employee._id, session.id)}
                        disabled={saving}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          hasSessionAccess(employee, session.id)
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {hasSessionAccess(employee, session.id) ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Granted
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Denied
                          </>
                        )}
                      </button>
                    </td>
                  ))}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      {sessions.map(session => {
                        const IconComponent = session.icon;
                        return (
                          <button
                            key={session.id}
                            onClick={() => handleSessionToggle(employee._id, session.id)}
                            disabled={saving}
                            className={`p-2 rounded-lg transition-colors ${
                              hasSessionAccess(employee, session.id)
                                ? `bg-${session.color}-100 text-${session.color}-600 hover:bg-${session.color}-200`
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={`${hasSessionAccess(employee, session.id) ? 'Revoke' : 'Grant'} ${session.name} access`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={sessions.length + 2} className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Loading employees...' : 'No employees found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessions.map(session => {
            const employeesWithAccess = employees.filter(emp => 
              hasSessionAccess(emp, session.id)
            );
            const percentage = employees.length > 0 
              ? Math.round((employeesWithAccess.length / employees.length) * 100) 
              : 0;
            
            return (
              <div key={session.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{session.name}</span>
                  <span className="text-sm text-gray-500">{percentage}%</span>
                </div>
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {employeesWithAccess.length} of {employees.length} employees
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SessionManagementTab;

import React, { useState, useEffect } from 'react';
import OrdersManagement from '../OrdersManagement';
import OrdersTab from '../OrdersTab';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AuraNestDashboard = ({ employee }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch orders for this employee (simulate OrdersManagement logic)
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('employeeToken');
        const res = await fetch('/api/orders');
        const data = await res.json();
        const filtered = data.orders.filter(
          o => o.assignedEmployee === employee._id || o.employeeId === employee._id || o.assignedTo === employee._id
        );
        setOrders(filtered);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    if (employee && employee._id) fetchOrders();
  }, [employee]);

  // Stats
  const totalBooked = orders.length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const returned = orders.filter(o => o.status === 'returned').length;
  const successRate = totalBooked > 0 ? ((delivered / totalBooked) * 100).toFixed(1) : 0;
  const returnRate = totalBooked > 0 ? ((returned / totalBooked) * 100).toFixed(1) : 0;

  // Dummy daily hours data
  const dailyHours = [
    { day: 'Mon', hours: 7 },
    { day: 'Tue', hours: 8 },
    { day: 'Wed', hours: 6 },
    { day: 'Thu', hours: 7 },
    { day: 'Fri', hours: 8 },
    { day: 'Sat', hours: 5 },
    { day: 'Sun', hours: 0 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Aura Nest Dashboard</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-blue-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-700">{totalBooked}</div>
              <div className="text-sm text-blue-800 font-medium">Total Booked</div>
            </div>
            <div className="bg-green-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-700">{delivered}</div>
              <div className="text-sm text-green-800 font-medium">Delivered</div>
            </div>
            <div className="bg-red-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-red-700">{returned}</div>
              <div className="text-sm text-red-800 font-medium">Returned</div>
            </div>
            <div className="bg-purple-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-700">{successRate}%</div>
              <div className="text-sm text-purple-800 font-medium">Success Rate</div>
            </div>
            <div className="bg-yellow-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-700">{returnRate}%</div>
              <div className="text-sm text-yellow-800 font-medium">Return Rate</div>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Hours (Dummy Data)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

const AuraNestTab = ({ employee }) => {
  const [activeTab, setActiveTab] = useState('orders');
  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'orders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-green-600'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
      </div>
      {activeTab === 'orders' && (
        <OrdersTab isAdmin={false} employee={employee} />
      )}
      {activeTab === 'dashboard' && (
        <AuraNestDashboard employee={employee} />
      )}
    </div>
  );
};

export default AuraNestTab; 
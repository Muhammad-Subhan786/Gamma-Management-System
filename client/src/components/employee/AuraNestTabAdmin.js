import React, { useState, useEffect } from 'react';
import OrdersManagement from '../OrdersManagement';
import OrdersTab from '../OrdersTab';
import VendorsTab from '../VendorsTab';
import ExpensesTab from '../ExpensesTab';
import PayrollTab from '../PayrollTab';
import { BarChart3, TrendingUp, DollarSign, CreditCard, Store, PieChart } from 'lucide-react';
import { ordersAPI, expensesAPI, payrollAPI, vendorsAPI } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Pie, Cell } from 'recharts';

// 1. CouriersTab placeholder
const CouriersTab = () => {
  const [couriers, setCouriers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atsMin, setAtsMin] = useState('');
  const [atsMax, setAtsMax] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courierRes, statsRes] = await Promise.all([
          vendorsAPI.getCouriers(),
          ordersAPI.getCourierStats()
        ]);
        setCouriers(Array.isArray(courierRes.data) ? courierRes.data : []);
        setStats(Array.isArray(statsRes.data) ? statsRes.data : []);
      } catch (err) {
        setCouriers([]);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter stats by ATS
  const filteredStats = stats.filter(s => {
    const ats = s.ats || 0;
    if (atsMin && ats < Number(atsMin)) return false;
    if (atsMax && ats > Number(atsMax)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Couriers Dashboard</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">Order Stats</h3>
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ATS Min</label>
            <input type="number" value={atsMin} onChange={e => setAtsMin(e.target.value)} className="border rounded px-2 py-1 w-24" placeholder="Min" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ATS Max</label>
            <input type="number" value={atsMax} onChange={e => setAtsMax(e.target.value)} className="border rounded px-2 py-1 w-24" placeholder="Max" />
          </div>
        </div>
        {loading ? (
          <div className="text-gray-400">Loading couriers and stats...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Courier Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Returned</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ATS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map(stat => {
                  const courier = couriers.find(c => c.name === stat._id);
                  return (
                    <tr key={stat._id || 'unknown'}>
                      <td className="px-4 py-2 whitespace-nowrap font-semibold text-gray-900">{stat._id || 'Unknown'}</td>
                      <td className="px-4 py-2">{stat.totalOrders}</td>
                      <td className="px-4 py-2">{stat.delivered}</td>
                      <td className="px-4 py-2">{stat.returned}</td>
                      <td className="px-4 py-2">${stat.totalRevenue?.toLocaleString() || 0}</td>
                      <td className="px-4 py-2">${stat.ats?.toFixed(2) || 0}</td>
                    </tr>
                  );
                })}
                {filteredStats.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-4">No couriers found for selected ATS filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">Sales Closing</h3>
        {/* TODO: Implement sales closing logic */}
        <div className="text-gray-400">Sales closing section coming soon...</div>
      </div>
    </div>
  );
};

// 2. Add employee sales trend graph to AuraNestDashboardAdmin
const AuraNestDashboardAdmin = () => {
  // Dummy data for employee sales trend
  const [salesTrend, setSalesTrend] = useState([
    { date: '2024-07-01', sales: 10 },
    { date: '2024-07-02', sales: 15 },
    { date: '2024-07-03', sales: 8 },
    { date: '2024-07-04', sales: 20 },
    { date: '2024-07-05', sales: 12 },
    { date: '2024-07-06', sales: 18 },
    { date: '2024-07-07', sales: 14 },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Aura Nest Admin Dashboard</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" /> Employee Daily Sales Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* TODO: Add stats, graphs, and analytics here */}
      <div className="bg-white rounded-lg shadow p-6">Coming soon: Order stats, delivery rates, return rates, and more!</div>
    </div>
  );
};

const FinanceTab = () => {
  const [orderStats, setOrderStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [orderRes, expenseRes, payrollRes] = await Promise.all([
          ordersAPI.getAnalytics(),
          expensesAPI.getAll(),
          payrollAPI.getAll()
        ]);
        setOrderStats(orderRes.data);
        setExpenses(Array.isArray(expenseRes.data) ? expenseRes.data : []);
        setPayrolls(Array.isArray(payrollRes.data) ? payrollRes.data : []);
      } catch (error) {
        setOrderStats(null);
        setExpenses([]);
        setPayrolls([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalPayroll = payrolls.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalRevenue = orderStats?.totalRevenue || 0;
  const grossProfit = orderStats?.totalProfit || 0;
  const netProfit = totalRevenue - totalExpenses - totalPayroll;
  const ebitda = netProfit; // For simplicity, EBITDA = Net Profit (no interest, taxes, depreciation, amortization breakdown)
  const totalOrders = orderStats?.totalOrders || 0;
  const delivered = orderStats?.statusBreakdown?.delivered || 0;
  const returned = orderStats?.statusBreakdown?.returned || 0;

  // Pie chart data
  const orderPieData = [
    { name: 'Delivered', value: delivered },
    { name: 'Returned', value: returned },
    { name: 'Other', value: totalOrders - delivered - returned }
  ];
  const COLORS = ['#22c55e', '#f59e42', '#a3a3a3'];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <PieChart className="h-7 w-7 text-blue-500" /> Finance & Analytics
      </h2>
      {loading ? (
        <div className="text-center text-gray-400">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
              <BarChart3 className="h-7 w-7 text-blue-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{totalOrders}</div>
                <div className="text-sm text-blue-800 font-medium">Total Orders</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
              <TrendingUp className="h-7 w-7 text-green-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-green-700">${totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-green-800 font-medium">Total Revenue</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
              <DollarSign className="h-7 w-7 text-yellow-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-yellow-700">${totalExpenses.toLocaleString()}</div>
                <div className="text-sm text-yellow-800 font-medium">Total Expenses</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
              <CreditCard className="h-7 w-7 text-red-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-red-700">${totalPayroll.toLocaleString()}</div>
                <div className="text-sm text-red-800 font-medium">Total Payroll</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
              <TrendingUp className="h-7 w-7 text-purple-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-purple-700">${grossProfit.toLocaleString()}</div>
                <div className="text-sm text-purple-800 font-medium">Gross Profit</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
              <TrendingUp className="h-7 w-7 text-pink-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-pink-700">${netProfit.toLocaleString()}</div>
                <div className="text-sm text-pink-800 font-medium">Net Profit</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center">
              <TrendingUp className="h-7 w-7 text-cyan-600 mr-4" />
              <div>
                <div className="text-2xl font-bold text-cyan-700">${ebitda.toLocaleString()}</div>
                <div className="text-sm text-cyan-800 font-medium">EBITDA</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-blue-600" /> Order Status Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {orderPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Add more charts here for trends, e.g., revenue over time, expenses over time */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" /> Revenue & Expenses Trend (Coming Soon)
              </h3>
              {/* TODO: Implement revenue/expense trend chart */}
              <div className="text-gray-400 text-center">Trend charts coming soon...</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AuraNestTabAdmin = () => {
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
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'couriers' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-orange-600'}`}
          onClick={() => setActiveTab('couriers')}
        >
          Couriers
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'vendors' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
          onClick={() => setActiveTab('vendors')}
        >
          Vendors
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-yellow-600'}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'payroll' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-red-600'}`}
          onClick={() => setActiveTab('payroll')}
        >
          Payroll
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'finance' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-cyan-600'}`}
          onClick={() => setActiveTab('finance')}
        >
          Finance
        </button>
      </div>
      {activeTab === 'orders' && (
        <OrdersTab isAdmin={true} employee={null} auraNestAdmin={true} />
      )}
      {activeTab === 'dashboard' && (
        <AuraNestDashboardAdmin />
      )}
      {activeTab === 'couriers' && (
        <CouriersTab />
      )}
      {activeTab === 'vendors' && (
        <VendorsTab />
      )}
      {activeTab === 'expenses' && (
        <ExpensesTab />
      )}
      {activeTab === 'payroll' && (
        <PayrollTab />
      )}
      {activeTab === 'finance' && (
        <FinanceTab />
      )}
    </div>
  );
};

export default AuraNestTabAdmin; 
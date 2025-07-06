import React, { useState, useEffect } from 'react';
import { uspsTransactionsAPI } from '../services/api';
import { DollarSign, Mail, User, FileImage, Calendar, BarChart3, TrendingUp, Search, Filter } from 'lucide-react';

const USPSTransactionsTabAdmin = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCarrier, setFilterCarrier] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    thisMonthTransactions: 0,
    thisMonthAmount: 0
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await uspsTransactionsAPI.getAllTransactions();
      setTransactions(data);
      
      // Calculate stats
      const totalAmount = data.reduce((sum, t) => sum + t.amount, 0);
      const now = new Date();
      const thisMonth = data.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      });
      const thisMonthAmount = thisMonth.reduce((sum, t) => sum + t.amount, 0);
      
      setStats({
        totalTransactions: data.length,
        totalAmount,
        thisMonthTransactions: thisMonth.length,
        thisMonthAmount
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.receiver.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = !filterCarrier || transaction.carrier === filterCarrier;
    
    const matchesDate = !filterDate || transaction.date.includes(filterDate);
    
    return matchesSearch && matchesCarrier && matchesDate;
  });

  const carriers = [...new Set(transactions.map(t => t.carrier))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-green-600" />
            All USPS Transactions
          </h2>
          <p className="text-gray-600 mt-1">View and manage all employee transactions</p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              TOTAL
            </span>
          </div>
          <div className="text-2xl font-black text-blue-900 mb-1">
            {stats.totalTransactions}
          </div>
          <div className="text-sm text-blue-700">
            Transactions
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
              TOTAL
            </span>
          </div>
          <div className="text-2xl font-black text-green-900 mb-1">
            ${stats.totalAmount.toLocaleString()}
          </div>
          <div className="text-sm text-green-700">
            Total Amount
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="h-6 w-6 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
              THIS MONTH
            </span>
          </div>
          <div className="text-2xl font-black text-purple-900 mb-1">
            {stats.thisMonthTransactions}
          </div>
          <div className="text-sm text-purple-700">
            Transactions
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
              THIS MONTH
            </span>
          </div>
          <div className="text-2xl font-black text-orange-900 mb-1">
            ${stats.thisMonthAmount.toLocaleString()}
          </div>
          <div className="text-sm text-orange-700">
            Amount
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email, sender, or receiver..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Carrier
            </label>
            <select
              value={filterCarrier}
              onChange={(e) => setFilterCarrier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="">All Carriers</option>
              {carriers.map(carrier => (
                <option key={carrier} value={carrier}>{carrier}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCarrier('');
                setFilterDate('');
              }}
              className="w-full bg-gray-500 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Transaction History ({filteredTransactions.length} transactions)
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Screenshot
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.createdBy?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.carrier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ${transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.sender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.receiver}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.screenshot ? (
                        <a
                          href={uspsTransactionsAPI.getScreenshot(transaction.screenshot.split('/').pop())}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <FileImage className="h-4 w-4 mr-1" />
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">No file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default USPSTransactionsTabAdmin; 
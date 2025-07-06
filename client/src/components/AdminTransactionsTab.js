import React, { useState, useEffect } from 'react';
import { transactionAPI, employeeAPI } from '../services/api';
import { 
  DollarSign, 
  Mail, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Check,
  Ban,
  Search,
  TrendingUp
} from 'lucide-react';

const AdminTransactionsTab = () => {
  const [dashboard, setDashboard] = useState({ 
    totalTransactions: 0, 
    pendingTransactions: 0, 
    approvedTransactions: 0, 
    totalAmount: 0,
    monthlyTransactions: 0,
    monthlyAmount: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    loadDashboard();
    loadTransactions();
  }, [filters]);

  const loadDashboard = async () => {
    try {
      const { data } = await transactionAPI.getAdminDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = { limit: 50, ...filters };
      const { data } = await transactionAPI.getAllTransactions(params);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await transactionAPI.updateStatus(id, status);
      setSuccess(`Transaction ${status} successfully!`);
      loadTransactions();
      loadDashboard();
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error updating transaction status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionAPI.deleteTransaction(id);
      setSuccess('Transaction deleted successfully!');
      loadTransactions();
      loadDashboard();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Error deleting transaction');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Transactions</h2>
        <p className="text-gray-600">Manage all payment transaction records</p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              TOTAL
            </span>
          </div>
          <div className="text-3xl font-black text-blue-900 mb-1">
            ${dashboard.totalAmount.toLocaleString()}
          </div>
          <div className="text-sm text-blue-700">
            {dashboard.approvedTransactions} approved transactions
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
              APPROVED
            </span>
          </div>
          <div className="text-3xl font-black text-green-900 mb-1">
            {dashboard.approvedTransactions}
          </div>
          <div className="text-sm text-green-700">
            Approved transactions
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
              PENDING
            </span>
          </div>
          <div className="text-3xl font-black text-yellow-900 mb-1">
            {dashboard.pendingTransactions}
          </div>
          <div className="text-sm text-yellow-700">
            Pending approval
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
              MONTHLY
            </span>
          </div>
          <div className="text-3xl font-black text-purple-900 mb-1">
            ${dashboard.monthlyAmount.toLocaleString()}
          </div>
          <div className="text-sm text-purple-700">
            {dashboard.monthlyTransactions} this month
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by email, sender, receiver..."
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.employeeId?.name || transaction.employeeName}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.sender} → {transaction.receiver}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.carrier}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        ${transaction.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <a
                          href={`${process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app'}/${transaction.screenshot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="View Screenshot"
                        >
                          <Eye className="h-4 w-4" />
                        </a>

                        {transaction.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(transaction._id, 'approved')}
                              className="text-green-600 hover:text-green-800"
                              title="Approve Transaction"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(transaction._id, 'rejected')}
                              className="text-red-600 hover:text-red-800"
                              title="Reject Transaction"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(transaction._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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

export default AdminTransactionsTab; 
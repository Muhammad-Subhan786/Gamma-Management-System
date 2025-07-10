import React, { useState, useEffect } from 'react';
import { transactionsAPI, ordersAPI } from '../services/api';

const TransactionsManagement = ({ isAdmin }) => {
  const [transactions, setTransactions] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filters, setFilters] = useState({
    transactionType: '',
    status: '',
    source: '',
    paymentMethod: '',
    customerPhone: ''
  });

  const [formData, setFormData] = useState({
    transactionType: 'income',
    amount: 0,
    currency: 'PKR',
    source: 'order_payment',
    orderId: '',
    leadId: '',
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash',
    description: '',
    notes: '',
    receiptNumber: '',
    receiptImage: ''
  });

  const [approvalData, setApprovalData] = useState({
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, pendingRes] = await Promise.all([
        transactionsAPI.getAll(filters),
        transactionsAPI.getPendingApproval()
      ]);
      
      setTransactions(transactionsRes.data.transactions || []);
      setPendingApprovals(pendingRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.create(formData);
      setShowCreateForm(false);
      setFormData({
        transactionType: 'income',
        amount: 0,
        currency: 'PKR',
        source: 'order_payment',
        orderId: '',
        leadId: '',
        customerName: '',
        customerPhone: '',
        paymentMethod: 'cash',
        description: '',
        notes: '',
        receiptNumber: '',
        receiptImage: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.approve(selectedTransaction._id, approvalData);
      setShowApprovalForm(false);
      setSelectedTransaction(null);
      setApprovalData({ notes: '' });
      loadData();
    } catch (error) {
      console.error('Error approving transaction:', error);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.reject(selectedTransaction._id, approvalData);
      setShowApprovalForm(false);
      setSelectedTransaction(null);
      setApprovalData({ notes: '' });
      loadData();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
    }
  };

  const handleValidate = async (transactionId) => {
    try {
      await transactionsAPI.validate(transactionId, { notes: 'Validated by admin' });
      loadData();
    } catch (error) {
      console.error('Error validating transaction:', error);
    }
  };

  const handleReconcile = async (transactionId) => {
    try {
      await transactionsAPI.reconcile(transactionId, { reconciledBy: 'admin' });
      loadData();
    } catch (error) {
      console.error('Error reconciling transaction:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      income: 'bg-green-100 text-green-800',
      expense: 'bg-red-100 text-red-800',
      advance: 'bg-blue-100 text-blue-800',
      refund: 'bg-purple-100 text-purple-800',
      commission: 'bg-indigo-100 text-indigo-800',
      bonus: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transactions Management</h2>
      </div>

      {/* Professional Create Transaction Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Transaction</h3>
        <form onSubmit={handleCreateTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-2xl shadow-xl bg-gradient-to-r from-indigo-100 via-blue-100 to-green-100 border border-blue-100 animate-gradient-x">
          <h2 className="col-span-2 text-2xl font-bold mb-4 text-blue-700 bg-gradient-to-r from-blue-400 via-green-400 to-indigo-400 bg-clip-text text-transparent animate-gradient-x">Create New Transaction</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select name="transactionType" value={formData.transactionType} onChange={e => setFormData({ ...formData, transactionType: e.target.value })} className="input-field w-full" required tabIndex={1}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="advance">Advance</option>
              <option value="refund">Refund</option>
              <option value="commission">Commission</option>
              <option value="bonus">Bonus</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" name="amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="input-field w-full" min={0} required tabIndex={2} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('currencyField')?.focus(); } }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <input id="currencyField" type="text" name="currency" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="input-field w-full" required tabIndex={3} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('sourceField')?.focus(); } }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select id="sourceField" name="source" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} className="input-field w-full" required tabIndex={4} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('customerNameField')?.focus(); } }}>
              <option value="order_payment">Order Payment</option>
              <option value="advance_payment">Advance Payment</option>
              <option value="full_payment">Full Payment</option>
              <option value="refund">Refund</option>
              <option value="commission">Commission</option>
              <option value="bonus">Bonus</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input id="customerNameField" type="text" name="customerName" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="input-field w-full" required tabIndex={5} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('customerPhoneField')?.focus(); } }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
            <input id="customerPhoneField" type="text" name="customerPhone" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="input-field w-full" required tabIndex={6} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('paymentMethodField')?.focus(); } }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select id="paymentMethodField" name="paymentMethod" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} className="input-field w-full" required tabIndex={7} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('descriptionField')?.focus(); } }}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="jazz_cash">Jazz Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="descriptionField" name="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field w-full" rows={2} tabIndex={8} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('notesField')?.focus(); } }} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="notesField" name="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input-field w-full" rows={2} tabIndex={9} />
          </div>
          <div className="md:col-span-2 flex gap-4 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Save Transaction</button>
            <button type="button" onClick={() => setFormData({
              transactionType: 'income',
              amount: 0,
              currency: 'PKR',
              source: 'order_payment',
              orderId: '',
              leadId: '',
              customerName: '',
              customerPhone: '',
              paymentMethod: 'cash',
              description: '',
              notes: '',
              receiptNumber: '',
              receiptImage: ''
            })} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.transactionType}
            onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="advance">Advance</option>
            <option value="refund">Refund</option>
            <option value="commission">Commission</option>
            <option value="bonus">Bonus</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.source}
            onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Sources</option>
            <option value="order_payment">Order Payment</option>
            <option value="advance_payment">Advance Payment</option>
            <option value="full_payment">Full Payment</option>
            <option value="refund">Refund</option>
            <option value="commission">Commission</option>
            <option value="bonus">Bonus</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="easypaisa">EasyPaisa</option>
            <option value="jazz_cash">Jazz Cash</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            placeholder="Customer Phone"
            value={filters.customerPhone}
            onChange={(e) => setFilters(prev => ({ ...prev, customerPhone: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-orange-900 mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            {pendingApprovals.map((transaction) => (
              <div key={transaction._id} className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {transaction.customerName} - PKR {transaction.amount?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.description} • {transaction.paymentMethod}
                    </div>
                    <div className="text-sm text-gray-500">
                      Requires approval for: PKR {transaction.approvalAmount?.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowApprovalForm(true);
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.receiptNumber || `TXN-${transaction._id.slice(-6)}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.source.replace('_', ' ')}
                    </div>
                    {transaction.requiresApproval && (
                      <div className="text-xs text-orange-600 font-medium">
                        Requires Approval
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.customerPhone}
                    </div>
                    {transaction.orderId && (
                      <div className="text-xs text-blue-600">
                        Order: {transaction.orderId.customerName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.transactionType)}`}>
                        {transaction.transactionType}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.currency} {transaction.amount?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.paymentMethod}
                    </div>
                    {transaction.reconciled && (
                      <div className="text-xs text-green-600 font-medium">
                        ✓ Reconciled
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {transaction.validatedBy ? (
                        <div className="text-xs text-green-600">
                          ✓ Validated by {transaction.validatedBy.name}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleValidate(transaction._id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Validate
                        </button>
                      )}
                      {!transaction.reconciled && (
                        <button
                          onClick={() => handleReconcile(transaction._id)}
                          className="text-xs text-purple-600 hover:text-purple-800"
                        >
                          Reconcile
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {transaction.status === 'pending_approval' && (
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowApprovalForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => {/* View details */}}
                        className="text-green-600 hover:text-green-900 text-sm"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transaction Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Transaction</h3>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <select
                value={formData.transactionType}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                required
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="advance">Advance</option>
                <option value="refund">Refund</option>
                <option value="commission">Commission</option>
                <option value="bonus">Bonus</option>
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="border rounded-lg px-3 py-2 w-full"
                min="0"
                step="0.01"
                required
              />

              <select
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                required
              >
                <option value="order_payment">Order Payment</option>
                <option value="advance_payment">Advance Payment</option>
                <option value="full_payment">Full Payment</option>
                <option value="refund">Refund</option>
                <option value="commission">Commission</option>
                <option value="bonus">Bonus</option>
                <option value="other">Other</option>
              </select>

              <input
                type="text"
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
              />

              <input
                type="text"
                placeholder="Customer Phone"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
              />

              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                required
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazz_cash">Jazz Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>

              <input
                type="text"
                placeholder="Receipt Number"
                value={formData.receiptNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
              />

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                rows="2"
              />

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                rows="2"
              />

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalForm && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Review Transaction</h3>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <div className="font-medium">{selectedTransaction.customerName}</div>
                <div className="text-gray-600">PKR {selectedTransaction.amount?.toLocaleString()}</div>
                <div className="text-gray-600">{selectedTransaction.description}</div>
                <div className="text-gray-600">{selectedTransaction.paymentMethod}</div>
              </div>
            </div>
            <form className="space-y-4">
              <textarea
                placeholder="Approval/Rejection Notes"
                value={approvalData.notes}
                onChange={(e) => setApprovalData(prev => ({ ...prev, notes: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                rows="3"
              />

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowApprovalForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsManagement; 
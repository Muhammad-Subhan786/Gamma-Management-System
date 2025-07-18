import React, { useState, useEffect } from 'react';
import { DollarSign, Edit, Trash2, Plus, Search } from 'lucide-react';
import { expensesAPI } from '../services/api';
import { vendorsAPI } from '../services/api';

const ExpensesTab = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    vendorId: '',
    date: '',
    description: '',
    isActive: true
  });
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    loadExpenses();
    vendorsAPI.getAll().then(res => setVendors(Array.isArray(res.data) ? res.data : []));
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await expensesAPI.getAll();
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert('Failed to load expenses: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, expense = null) => {
    setModalType(type);
    setSelectedExpense(expense);
    if (type === 'edit' && expense) {
      setFormData({
        category: expense.category || '',
        amount: expense.amount || '',
        vendorId: expense.vendorId || '',
        date: expense.date ? expense.date.slice(0, 10) : '',
        description: expense.description || '',
        isActive: expense.isActive !== false
      });
    } else {
      setFormData({
        category: 'Shipping',
        amount: '150',
        vendorId: '', // Let user pick
        date: new Date().toISOString().slice(0, 10),
        description: 'Courier charges for June',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedExpense(null);
    setFormData({
      category: '',
      amount: '',
      vendorId: '',
      date: '',
      description: '',
      isActive: true
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modalType === 'add') {
        await expensesAPI.create(formData);
        alert('Expense added successfully!');
      } else {
        await expensesAPI.update(selectedExpense._id, formData);
        alert('Expense updated successfully!');
      }
      closeModal();
      loadExpenses();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setLoading(true);
    try {
      await expensesAPI.delete(id);
      alert('Expense deleted successfully!');
      loadExpenses();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = Array.isArray(expenses) ? expenses.filter(expense =>
    expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-yellow-600" />
            Expenses (ERP)
          </h2>
          <p className="text-gray-600 mt-1">Track and manage business expenses for Aura Nest.</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{expense.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${expense.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(vendors.find(v => v._id === expense.vendorId)?.name) || expense.vendorId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.date ? expense.date.slice(0, 10) : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openModal('edit', expense)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                        title="Edit expense"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                        title="Delete expense"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filteredExpenses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            {searchTerm ? 'No expenses found matching your search' : 'No expenses yet'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm ? 'Try a different search term' : 'Add your first expense to get started!'}
          </p>
        </div>
      )}
      {/* Modal for Add/Edit Expense */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
              title="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
              {modalType === 'add' ? <Plus className="h-5 w-5 mr-2 text-yellow-600" /> : <Edit className="h-5 w-5 mr-2 text-blue-600" />}
              {modalType === 'add' ? 'Add Expense' : 'Edit Expense'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Vendor</label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={loading}
                >
                  {modalType === 'add' ? 'Add Expense' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesTab; 
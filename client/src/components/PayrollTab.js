import React, { useState, useEffect } from 'react';
import { CreditCard, Edit, Trash2, Plus, Search } from 'lucide-react';
import { payrollAPI } from '../services/api';
import { employeeAPI } from '../services/api';

const PayrollTab = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    period: '',
    amount: '',
    status: '',
    notes: ''
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    loadPayrolls();
    employeeAPI.getAll().then(res => setEmployees(Array.isArray(res.data) ? res.data : []));
  }, []);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const res = await payrollAPI.getAll();
      setPayrolls(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert('Failed to load payroll records: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, payroll = null) => {
    setModalType(type);
    setSelectedPayroll(payroll);
    if (type === 'edit' && payroll) {
      setFormData({
        employeeId: payroll.employeeId || '',
        period: payroll.period || '',
        amount: payroll.amount || '',
        status: payroll.status || '',
        notes: payroll.notes || ''
      });
    } else {
      setFormData({
        employeeId: '', // Let user pick
        period: '2024-06',
        amount: '2000',
        status: 'paid',
        notes: 'Monthly salary'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayroll(null);
    setFormData({
      employeeId: '',
      period: '',
      amount: '',
      status: '',
      notes: ''
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
        await payrollAPI.create(formData);
        alert('Payroll record added successfully!');
      } else {
        await payrollAPI.update(selectedPayroll._id, formData);
        alert('Payroll record updated successfully!');
      }
      closeModal();
      loadPayrolls();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return;
    setLoading(true);
    try {
      await payrollAPI.delete(id);
      alert('Payroll record deleted successfully!');
      loadPayrolls();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredPayrolls = Array.isArray(payrolls) ? payrolls.filter(payroll =>
    payroll.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payroll.period?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-red-600" />
            Payroll (ERP)
          </h2>
          <p className="text-gray-600 mt-1">Manage payroll, salaries, and bonuses for Aura Nest employees.</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Payroll
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search payroll records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayrolls.map((payroll) => (
                <tr key={payroll._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{(employees.find(e => e._id === payroll.employeeId)?.name) || payroll.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payroll.period}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${payroll.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payroll.status}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payroll.notes}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openModal('edit', payroll)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                        title="Edit payroll"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(payroll._id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                        title="Delete payroll"
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
      {filteredPayrolls.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            {searchTerm ? 'No payroll records found matching your search' : 'No payroll records yet'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm ? 'Try a different search term' : 'Add your first payroll record to get started!'}
          </p>
        </div>
      )}
      {/* Modal for Add/Edit Payroll */}
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
              {modalType === 'add' ? <Plus className="h-5 w-5 mr-2 text-red-600" /> : <Edit className="h-5 w-5 mr-2 text-blue-600" />}
              {modalType === 'add' ? 'Add Payroll' : 'Edit Payroll'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Employee</label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Period</label>
                <input
                  type="text"
                  name="period"
                  value={formData.period}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. 2024-06"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Status</label>
                <input
                  type="text"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. paid, pending, failed"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={loading}
                >
                  {modalType === 'add' ? 'Add Payroll' : 'Update Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollTab; 
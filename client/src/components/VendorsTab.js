import React, { useState, useEffect } from 'react';
import { Store, Edit, Trash2, Plus, Search } from 'lucide-react';
import { vendorsAPI } from '../services/api';

const VendorsTab = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    isActive: true
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await vendorsAPI.getAll();
      setVendors(res.data);
    } catch (error) {
      alert('Failed to load vendors: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, vendor = null) => {
    setModalType(type);
    setSelectedVendor(vendor);
    if (type === 'edit' && vendor) {
      setFormData({
        name: vendor.name || '',
        contact: vendor.contact || '',
        category: vendor.category || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        isActive: vendor.isActive !== false
      });
    } else {
      setFormData({
        name: 'Acme Supplies',
        contact: 'John Doe',
        category: 'Packaging',
        email: 'acme@example.com',
        phone: '+1-555-123-4567',
        address: '123 Main St, Springfield',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVendor(null);
    setFormData({
      name: '',
      contact: '',
      category: '',
      email: '',
      phone: '',
      address: '',
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
        await vendorsAPI.create(formData);
        alert('Vendor added successfully!');
      } else {
        await vendorsAPI.update(selectedVendor._id, formData);
        alert('Vendor updated successfully!');
      }
      closeModal();
      loadVendors();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    setLoading(true);
    try {
      await vendorsAPI.delete(id);
      alert('Vendor deleted successfully!');
      loadVendors();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Defensive: ensure vendors is always an array
  const safeVendors = Array.isArray(vendors) ? vendors : [];
  const filteredVendors = safeVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Store className="h-6 w-6 mr-2 text-green-600" />
            Vendors (ERP)
          </h2>
          <p className="text-gray-600 mt-1">Manage your product vendors, view details, and track performance.</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Vendor
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.contact}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openModal('edit', vendor)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                        title="Edit vendor"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor._id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                        title="Delete vendor"
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
      {filteredVendors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            {searchTerm ? 'No vendors found matching your search' : 'No vendors yet'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm ? 'Try a different search term' : 'Add your first vendor to get started!'}
          </p>
        </div>
      )}
      {/* Modal for Add/Edit Vendor */}
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
              {modalType === 'add' ? <Plus className="h-5 w-5 mr-2 text-green-600" /> : <Edit className="h-5 w-5 mr-2 text-blue-600" />}
              {modalType === 'add' ? 'Add Vendor' : 'Edit Vendor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={loading}
                >
                  {modalType === 'add' ? 'Add Vendor' : 'Update Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsTab; 
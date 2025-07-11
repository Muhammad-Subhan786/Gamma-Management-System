import React, { useState, useEffect } from 'react';
import { ordersAPI, productsAPI } from '../services/api';

const OrdersManagement = ({ isAdmin }) => {
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    deliveryStatus: '',
    customerPhone: '',
    trackingNumber: ''
  });

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    secondaryPhone: '',
    customerEmail: '',
    customerAddress: '',
    products: [{ 
      name: '', 
      description: '', 
      quantity: 1, 
      price: 0, 
      image: '',
      productId: null 
    }],
    advanceAmount: 0,
    priority: 'medium',
    notes: '',
    specialInstructions: ''
  });

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState({});

  const [deliveryData, setDeliveryData] = useState({
    deliveryStatus: '',
    notes: '',
    trackingNumber: '',
    courierName: '',
    estimatedDelivery: ''
  });

  useEffect(() => {
    loadData();
    loadProducts();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const ordersRes = await ordersAPI.getAll(filters);
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsRes = await productsAPI.getAll();
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...formData,
        products: formData.products.filter(p => p.name && p.price > 0)
      };
      
      await ordersAPI.create(orderData);
      setShowCreateForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      secondaryPhone: '',
      customerEmail: '',
      customerAddress: '',
      products: [{ 
        name: '', 
        description: '', 
        quantity: 1, 
        price: 0, 
        image: '',
        productId: null 
      }],
      advanceAmount: 0,
      priority: 'medium',
      notes: '',
      specialInstructions: ''
    });
  };

  const handleUpdateDeliveryStatus = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.updateDeliveryStatus(selectedOrder._id, deliveryData);
      setShowDeliveryForm(false);
      setSelectedOrder(null);
      setDeliveryData({
        deliveryStatus: '',
        notes: '',
        trackingNumber: '',
        courierName: '',
        estimatedDelivery: ''
      });
      loadData();
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { 
        name: '', 
        description: '', 
        quantity: 1, 
        price: 0, 
        image: '',
        productId: null 
      }]
    }));
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const handleProductSearch = (index, searchTerm) => {
    setProductSearchTerm(searchTerm);
    updateProduct(index, 'name', searchTerm);
    
    if (searchTerm.length > 2) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowProductDropdown(prev => ({ ...prev, [index]: true }));
    } else {
      setFilteredProducts([]);
      setShowProductDropdown(prev => ({ ...prev, [index]: false }));
    }
  };

  const selectProduct = (index, product) => {
    updateProduct(index, 'name', product.name);
    updateProduct(index, 'description', product.description || '');
    updateProduct(index, 'price', product.price || 0);
    updateProduct(index, 'image', product.image || '');
    updateProduct(index, 'productId', product._id);
    setShowProductDropdown(prev => ({ ...prev, [index]: false }));
    setProductSearchTerm('');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDeliveryStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
        <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
      </div>

      {/* Enhanced Professional Create Order Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Order</h3>
        <form onSubmit={handleCreateOrder} className="space-y-6">
          {/* Mandatory Fields Section */}
          <div className="border-b border-gray-200 pb-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Required Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="customerName" 
                  value={formData.customerName} 
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="customerPhone" 
                  value={formData.customerPhone} 
                  onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Address <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="customerAddress" 
                  value={formData.customerAddress} 
                  onChange={e => setFormData({ ...formData, customerAddress: e.target.value })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                  rows={3}
                  required 
                />
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="border-b border-gray-200 pb-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Additional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Phone</label>
                <input 
                  type="text" 
                  name="secondaryPhone" 
                  value={formData.secondaryPhone} 
                  onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                <input 
                  type="email" 
                  name="customerEmail" 
                  value={formData.customerEmail} 
                  onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount (if applicable)</label>
                <input 
                  type="number" 
                  name="advanceAmount" 
                  value={formData.advanceAmount} 
                  onChange={e => setFormData({ ...formData, advanceAmount: parseFloat(e.target.value) || 0 })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select 
                  name="priority" 
                  value={formData.priority} 
                  onChange={e => setFormData({ ...formData, priority: e.target.value })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                  rows={2} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea 
                  name="specialInstructions" 
                  value={formData.specialInstructions} 
                  onChange={e => setFormData({ ...formData, specialInstructions: e.target.value })} 
                  className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                  rows={2} 
                />
              </div>
            </div>
          </div>

          {/* Product Selection Section */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Product Selection</h4>
            <div className="space-y-4">
              {formData.products.map((product, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Product Image */}
                    <div className="md:col-span-2">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg border flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="md:col-span-10">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Product Name with Auto-complete */}
                        <div className="md:col-span-2 relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={product.name} 
                            onChange={e => handleProductSearch(idx, e.target.value)} 
                            className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            required 
                          />
                          {/* Product Dropdown */}
                          {showProductDropdown[idx] && filteredProducts.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredProducts.map((prod) => (
                                <div
                                  key={prod._id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                                  onClick={() => selectProduct(idx, prod)}
                                >
                                  <div className="font-medium">{prod.name}</div>
                                  <div className="text-sm text-gray-600">PKR {prod.price}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="number" 
                            value={product.quantity} 
                            min={1} 
                            onChange={e => updateProduct(idx, 'quantity', parseInt(e.target.value) || 1)} 
                            className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            required 
                          />
                        </div>

                        {/* Editable Price */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (PKR) <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="number" 
                            value={product.price} 
                            min={0} 
                            step={0.01}
                            onChange={e => updateProduct(idx, 'price', parseFloat(e.target.value) || 0)} 
                            className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            required 
                          />
                        </div>
                      </div>

                      {/* Product Description */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                          value={product.description} 
                          onChange={e => updateProduct(idx, 'description', e.target.value)} 
                          className="input-field w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          rows={2}
                        />
                      </div>

                      {/* Remove Button */}
                      {formData.products.length > 1 && (
                        <div className="mt-2">
                          <button 
                            type="button" 
                            onClick={() => removeProduct(idx)} 
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove Product
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Product Button */}
              <button 
                type="button" 
                onClick={addProduct} 
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Another Product
                </div>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Order
            </button>
        <button
              type="button" 
              onClick={resetForm} 
              className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
              Reset Form
        </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.deliveryStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, deliveryStatus: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Delivery Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="returned">Returned</option>
          </select>

          <input
            type="text"
            placeholder="Customer Phone"
            value={filters.customerPhone}
            onChange={(e) => setFilters(prev => ({ ...prev, customerPhone: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="text"
            placeholder="Tracking Number"
            value={filters.trackingNumber}
            onChange={(e) => setFilters(prev => ({ ...prev, trackingNumber: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      Order #{order._id.slice(-6)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.products.length} item(s)
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customerPhone}
                    </div>
                    {order.secondaryPhone && (
                      <div className="text-sm text-gray-500">
                        Alt: {order.secondaryPhone}
                      </div>
                    )}
                    {order.leadId && (
                      <div className="text-xs text-blue-600">
                        From Lead (Score: {order.leadId.qualificationScore})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDeliveryStatusColor(order.deliveryStatus)}`}>
                      {order.deliveryStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      PKR {order.totalAmount?.toLocaleString()}
                    </div>
                    {order.advanceAmount > 0 && (
                    <div className="text-sm text-gray-500">
                      Advance: PKR {order.advanceAmount?.toLocaleString()}
                    </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDeliveryForm(true);
                        }}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Update Status
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Status Update Modal */}
      {showDeliveryForm && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Delivery Status</h3>
            <form onSubmit={handleUpdateDeliveryStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
              <select
                value={deliveryData.deliveryStatus}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryStatus: e.target.value }))}
                  className="input-field w-full"
                required
              >
                <option value="">Select Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="returned">Returned</option>
              </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
              <input
                type="text"
                value={deliveryData.trackingNumber}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="input-field w-full"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
              <input
                type="text"
                value={deliveryData.courierName}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, courierName: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={deliveryData.notes}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input-field w-full"
                  rows={3}
              />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveryForm(false);
                    setSelectedOrder(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement; 
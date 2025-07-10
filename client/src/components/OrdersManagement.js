import React, { useState, useEffect } from 'react';
import { ordersAPI, leadsAPI } from '../services/api';

const OrdersManagement = ({ isAdmin }) => {
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
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
    customerEmail: '',
    customerAddress: '',
    products: [{ name: '', description: '', quantity: 1, price: 0 }],
    advanceAmount: 0,
    priority: 'medium',
    notes: '',
    specialInstructions: ''
  });

  const [deliveryData, setDeliveryData] = useState({
    deliveryStatus: '',
    notes: '',
    trackingNumber: '',
    courierName: '',
    estimatedDelivery: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, leadsRes] = await Promise.all([
        ordersAPI.getAll(filters),
        leadsAPI.getAll({ status: 'ready_to_order' })
      ]);
      
      setOrders(ordersRes.data.orders || []);
      setLeads(leadsRes.data.leads || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        products: [{ name: '', description: '', quantity: 1, price: 0 }],
        advanceAmount: 0,
        priority: 'medium',
        notes: '',
        specialInstructions: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleCreateFromLead = async (leadId) => {
    try {
      const lead = leads.find(l => l._id === leadId);
      if (!lead) return;

      const orderData = {
        customerName: lead.customerName,
        customerPhone: lead.customerPhone,
        customerEmail: lead.customerEmail,
        customerAddress: lead.customerAddress,
        products: [{ name: lead.productInterest || 'Product', description: '', quantity: 1, price: lead.expectedPrice || 0 }],
        advanceAmount: lead.advanceAmount || 0,
        assignedEmployee: lead.assignedEmployee?._id,
        notes: lead.notes,
        leadId: lead._id
      };

      await ordersAPI.createFromLead(leadId, orderData);
      loadData();
    } catch (error) {
      console.error('Error creating order from lead:', error);
    }
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
      products: [...prev.products, { name: '', description: '', quantity: 1, price: 0 }]
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

      {/* Professional Create Order Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Order</h3>
        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input type="text" name="customerName" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
            <input type="text" name="customerPhone" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
            <input type="email" name="customerEmail" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
            <input type="text" name="customerAddress" value={formData.customerAddress} onChange={e => setFormData({ ...formData, customerAddress: e.target.value })} className="input-field w-full" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
            {formData.products.map((product, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2">
                <input type="text" placeholder="Name" value={product.name} onChange={e => updateProduct(idx, 'name', e.target.value)} className="input-field flex-1" required />
                <input type="text" placeholder="Description" value={product.description} onChange={e => updateProduct(idx, 'description', e.target.value)} className="input-field flex-1" />
                <input type="number" placeholder="Quantity" value={product.quantity} min={1} onChange={e => updateProduct(idx, 'quantity', e.target.value)} className="input-field w-24" required />
                <input type="number" placeholder="Price" value={product.price} min={0} onChange={e => updateProduct(idx, 'price', e.target.value)} className="input-field w-32" required />
                {formData.products.length > 1 && (
                  <button type="button" onClick={() => removeProduct(idx)} className="text-red-600 hover:text-red-800">Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addProduct} className="text-blue-600 hover:text-blue-800 mt-2">+ Add Product</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
            <input type="number" name="advanceAmount" value={formData.advanceAmount} onChange={e => setFormData({ ...formData, advanceAmount: e.target.value })} className="input-field w-full" min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select name="priority" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="input-field w-full">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input-field w-full" rows={2} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea name="specialInstructions" value={formData.specialInstructions} onChange={e => setFormData({ ...formData, specialInstructions: e.target.value })} className="input-field w-full" rows={2} />
          </div>
          <div className="md:col-span-2 flex gap-4 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Save Order</button>
            <button type="button" onClick={() => setFormData({
              customerName: '',
              customerPhone: '',
              customerEmail: '',
              customerAddress: '',
              products: [{ name: '', description: '', quantity: 1, price: 0 }],
              advanceAmount: 0,
              priority: 'medium',
              notes: '',
              specialInstructions: ''
            })} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
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
                    {order.trackingNumber && (
                      <div className="text-xs text-gray-500 mt-1">
                        #{order.trackingNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      PKR {order.totalAmount?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Advance: PKR {order.advanceAmount?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Remaining: PKR {order.remainingAmount?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDeliveryForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Update Delivery
                          </button>
                          <button
                            onClick={() => {/* View details */}}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            View
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ready to Order Leads */}
      {leads.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Leads Ready for Order Creation</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Interest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lead.customerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {lead.productInterest}
                      </div>
                      <div className="text-sm text-gray-500">
                        PKR {lead.expectedPrice?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${lead.qualificationScore * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{lead.qualificationScore}/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCreateFromLead(lead._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Create Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="border rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Customer Phone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  className="border rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="email"
                  placeholder="Customer Email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Advance Amount"
                  value={formData.advanceAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, advanceAmount: parseFloat(e.target.value) || 0 }))}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
              
              <textarea
                placeholder="Customer Address"
                value={formData.customerAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                rows="3"
                required
              />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Products</h4>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    + Add Product
                  </button>
                </div>
                {formData.products.map((product, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={product.name}
                      onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      className="border rounded-lg px-3 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={product.description}
                      onChange={(e) => updateProduct(index, 'description', e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="border rounded-lg px-3 py-2"
                      min="1"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Price"
                        value={product.price}
                        onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                        className="border rounded-lg px-3 py-2 flex-1"
                        min="0"
                        step="0.01"
                        required
                      />
                      {formData.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-800 px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input
                  type="text"
                  placeholder="Assigned Employee ID"
                  value={formData.assignedEmployee}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedEmployee: e.target.value }))}
                  className="border rounded-lg px-3 py-2"
                />
              </div>

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                rows="2"
              />

              <textarea
                placeholder="Special Instructions"
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
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
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Delivery Status Modal */}
      {showDeliveryForm && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Delivery Status</h3>
            <form onSubmit={handleUpdateDeliveryStatus} className="space-y-4">
              <select
                value={deliveryData.deliveryStatus}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryStatus: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
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

              <input
                type="text"
                placeholder="Tracking Number"
                value={deliveryData.trackingNumber}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
              />

              <input
                type="text"
                placeholder="Courier Name"
                value={deliveryData.courierName}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, courierName: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
              />

              <input
                type="date"
                placeholder="Estimated Delivery"
                value={deliveryData.estimatedDelivery}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
              />

              <textarea
                placeholder="Delivery Notes"
                value={deliveryData.notes}
                onChange={(e) => setDeliveryData(prev => ({ ...prev, notes: e.target.value }))}
                className="border rounded-lg px-3 py-2 w-full"
                rows="3"
              />

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeliveryForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Status
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
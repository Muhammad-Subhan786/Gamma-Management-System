import React, { useState, useEffect, useRef } from 'react';
import { ordersAPI, productsAPI } from '../services/api';

const OrdersManagement = ({ isAdmin, employee, auraNestOnly, auraNestAdmin }) => {
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
    city: '',
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
    specialInstructions: '',
    assignedEmployee: isAdmin ? '' : (employee?._id || '')
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

  const [addressConfirmed, setAddressConfirmed] = useState({});
  const [selectedOrders, setSelectedOrders] = useState([]);
  const csvLinkRef = useRef(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    loadData();
    loadProducts();
    if (isAdmin) {
      fetch('/api/employees')
        .then(res => res.json())
        .then(data => setEmployees(data.employees || []));
    }
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const ordersRes = await ordersAPI.getAll(filters);
      let loadedOrders = ordersRes.data.orders || [];
      if (auraNestOnly && employee) {
        loadedOrders = loadedOrders.filter(o => {
          // assignedEmployee can be an ObjectId (string) or a populated object
          if (!o.assignedEmployee) return false;
          if (typeof o.assignedEmployee === 'string') {
            return o.assignedEmployee === employee._id;
          }
          if (typeof o.assignedEmployee === 'object' && o.assignedEmployee._id) {
            return o.assignedEmployee._id === employee._id;
          }
          // fallback for legacy fields
          return o.employeeId === employee._id || o.assignedTo === employee._id;
        });
      }
      setOrders(loadedOrders);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsRes = await productsAPI.getAll();
      const data = productsRes.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setProducts([]);
      console.error('Error loading products:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...formData,
        products: formData.products.filter(p => p.name && p.price > 0),
        assignedEmployee: isAdmin ? formData.assignedEmployee : (employee?._id || undefined)
      };
      
      await ordersAPI.create(orderData);
      setShowCreateForm(false);
      resetForm();
      loadData();
    } catch (error) {
      let errorMsg = 'Error creating order.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMsg += ' ' + error.response.data.error;
        if (error.response.data.details) {
          errorMsg += ' Details: ' + JSON.stringify(error.response.data.details);
        }
        if (error.response.data.invalidProducts) {
          errorMsg += ' Invalid products: ' + JSON.stringify(error.response.data.invalidProducts);
        }
      }
      alert(errorMsg);
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
      city: '',
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
      specialInstructions: '',
      assignedEmployee: isAdmin ? '' : (employee?._id || '')
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

    const safeProducts = Array.isArray(products) ? products : [];
    if (searchTerm.length > 2) {
      const filtered = safeProducts.filter(product =>
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

  // Helper: check if address is confirmed (admin only for auraNestAdmin)
  const isAddressConfirmed = (order) => auraNestAdmin ? !!addressConfirmed[order._id] : true;

  // Handle select/deselect order
  const handleSelectOrder = (order) => {
    setSelectedOrders(prev =>
      prev.includes(order._id)
        ? prev.filter(id => id !== order._id)
        : [...prev, order._id]
    );
  };
  const handleSelectAll = () => {
    const eligible = orders.filter(isAddressConfirmed).map(o => o._id);
    if (eligible.every(id => selectedOrders.includes(id))) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(eligible);
    }
  };

  // CSV generation for dodelive
  const generateDodeliveCSV = () => {
    const header = [
      'Consignee Name', 'Consignee Address', 'Consignee Contact No', 'Consignee Email',
      'Product Name', 'COD', 'Pieces', 'Weight', 'Destination', 'Customer Reference', 'Customer Comment', 'location_id'
    ];
    const rows = orders.filter(o => selectedOrders.includes(o._id)).map(order => [
      order.customerName || '',
      order.customerAddress || '',
      order.customerPhone || '',
      order.customerEmail || '',
      (order.products && order.products.length > 0 ? order.products.map(p => p.name).join('; ') : ''),
      order.totalAmount || '',
      (order.products && order.products.length > 0 ? order.products.map(p => p.quantity).join('; ') : ''),
      '', // Weight (optional, left blank)
      order.city || '',
      order._id || '', // Customer Reference
      order.notes || '',
      '' // location_id (optional)
    ]);
    const csvContent = [header, ...rows].map(r => r.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dodelive_labels_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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

      {/* On-brand Create Order Form */}
      <div className="aura-card aura-glass p-8 mb-8 max-w-3xl mx-auto shadow-xl transition-all duration-300">
        <h3 className="text-2xl font-extrabold aura-gradient-text mb-8 tracking-tight flex items-center gap-2">
          <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Create New Order
        </h3>
        <form onSubmit={handleCreateOrder} className="space-y-8">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <input autoFocus type="text" name="customerName" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="input-field" placeholder="Customer Name *" required />
            </div>
            <div>
              <input type="text" name="customerPhone" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="input-field" placeholder="Customer Phone *" required />
            </div>
            <div>
              <input type="text" name="secondaryPhone" value={formData.secondaryPhone} onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value })} className="input-field" placeholder="Secondary Phone" />
            </div>
            <div className="md:col-span-2">
              <input type="email" name="customerEmail" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} className="input-field" placeholder="Customer Email" />
            </div>
            <div className="md:col-span-3">
              <textarea name="customerAddress" value={formData.customerAddress} onChange={e => setFormData({ ...formData, customerAddress: e.target.value })} className="input-field" placeholder="Customer Address *" rows={2} required />
            </div>
            <div className="md:col-span-1">
              <input type="text" name="city" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="input-field" placeholder="City *" required />
            </div>
          </div>
          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <input type="number" name="advanceAmount" value={formData.advanceAmount} onChange={e => setFormData({ ...formData, advanceAmount: parseFloat(e.target.value) || 0 })} className="input-field" placeholder="Advance Amount" min={0} step={0.01} />
            </div>
            <div>
              <select name="priority" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <textarea name="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input-field" placeholder="Notes" rows={2} />
            </div>
            <div className="md:col-span-4">
              <textarea name="specialInstructions" value={formData.specialInstructions} onChange={e => setFormData({ ...formData, specialInstructions: e.target.value })} className="input-field" placeholder="Special Instructions" rows={2} />
            </div>
          </div>
          {/* Product Selection */}
          <div>
            <h4 className="text-lg font-bold aura-gradient-text mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Products
            </h4>
            <div className="space-y-4">
              {formData.products.map((product, idx) => (
                <div key={idx} className="aura-card p-4 flex flex-col md:flex-row gap-4 items-start group transition-all duration-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Product Name *" value={product.name} onChange={e => handleProductSearch(idx, e.target.value)} className="input-field" required />
                      {showProductDropdown[idx] && filteredProducts.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-primary-200 rounded-md shadow-lg max-h-60 overflow-auto animate-fade-in">
                          {filteredProducts.map((prod) => (
                            <div
                              key={prod._id}
                              className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-50 transition-colors"
                              onClick={() => selectProduct(idx, prod)}
                            >
                              <div className="font-medium">{prod.name}</div>
                              <div className="text-sm text-primary-600">PKR {prod.price}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <input type="number" value={product.quantity} min={1} onChange={e => updateProduct(idx, 'quantity', parseInt(e.target.value) || 1)} className="input-field" placeholder="Quantity *" required />
                    </div>
                    <div>
                      <input type="number" value={product.price} min={0} step={0.01} onChange={e => updateProduct(idx, 'price', parseFloat(e.target.value) || 0)} className="input-field" placeholder="Price *" required />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:w-32">
                    <textarea value={product.description} onChange={e => updateProduct(idx, 'description', e.target.value)} className="input-field" placeholder="Description" rows={2} />
                    {formData.products.length > 1 && (
                      <button type="button" onClick={() => removeProduct(idx)} className="btn-secondary text-xs font-medium transition-colors">Remove</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addProduct} className="w-full border-2 border-dashed border-primary-300 rounded-lg p-4 text-primary-600 hover:border-primary-500 hover:text-primary-700 transition-colors bg-primary-50/40 btn-secondary">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Add Another Product
                </div>
              </button>
            </div>
          </div>
          {isAdmin && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Employee</label>
              <select
                name="assignedEmployee"
                value={formData.assignedEmployee}
                onChange={e => setFormData({ ...formData, assignedEmployee: e.target.value })}
                className="input-field w-full"
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                ))}
              </select>
            </div>
          )}
          {/* Sticky Action Bar */}
          <div className="sticky bottom-0 left-0 w-full bg-gradient-to-r from-primary-50/80 to-primary-100/80 border-t border-primary-200 py-4 px-6 flex gap-4 justify-end rounded-b-2xl shadow-lg z-10 transition-all duration-300">
            <button type="submit" className="btn-primary px-8 py-3 font-bold shadow-md">Create Order</button>
            <button type="button" onClick={resetForm} className="btn-secondary px-8 py-3 font-bold">Reset Form</button>
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
                <th className="px-2 py-3">
                  <input type="checkbox" onChange={handleSelectAll} checked={orders.filter(isAddressConfirmed).length > 0 && orders.filter(isAddressConfirmed).every(o => selectedOrders.includes(o._id))} />
                </th>
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
                {auraNestAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirm Address
                  </th>
                )}
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-2 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOrder(order)}
                      disabled={!isAddressConfirmed(order)}
                      title={!isAddressConfirmed(order) ? 'Admin must confirm address' : ''}
                    />
                  </td>
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
                    {order.city && (
                      <div className="text-sm text-gray-500">
                        City: {order.city}
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
                  {auraNestAdmin && (
                    <td className="px-6 py-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={!!addressConfirmed[order._id]}
                          onChange={e => setAddressConfirmed(prev => ({ ...prev, [order._id]: e.target.checked }))}
                          className="form-checkbox h-5 w-5 text-green-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Confirmed</span>
                      </label>
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-6 py-4">
                      {order.assignedEmployee?.name ? (
                        <span className="text-sm font-medium text-blue-700">{order.assignedEmployee.name}</span>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </td>
                  )}
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

      {/* Bulk action bar below table */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-white shadow-lg rounded-xl px-8 py-4 flex items-center gap-6 border border-primary-200">
          <span className="font-semibold text-primary-700">{selectedOrders.length} order(s) selected</span>
          <button
            className="btn-primary px-6 py-2 font-bold"
            onClick={generateDodeliveCSV}
          >
            Generate Dodelive Labels
          </button>
        </div>
      )}
      {/* Toast/alert for success */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold">
          Dodelive labels CSV generated and download started!
        </div>
      )}

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
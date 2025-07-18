import React, { useState, useEffect, useRef } from 'react';
import { ordersAPI, productsAPI } from '../services/api';

const OrdersManagement = ({ isAdmin, employee, auraNestOnly, auraNestAdmin }) => {
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    deliveryStatus: '',
    customerPhone: '',
    trackingNumber: ''
  });

  // Remove all formData, handleCreateOrder, resetForm, addProduct, removeProduct, updateProduct, and related state/hooks.
  // Only keep logic for order listing, filtering, selection, and management.
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

  const [selectedOrders, setSelectedOrders] = useState([]);
  const csvLinkRef = useRef(null);
  const [showToast, setShowToast] = useState(false);
  const [hoveredOrderId, setHoveredOrderId] = useState(null);

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

  // Remove all formData, handleCreateOrder, resetForm, addProduct, removeProduct, updateProduct, and related state/hooks.
  // Only keep logic for order listing, filtering, selection, and management.
  const handleProductSearch = (index, searchTerm) => {
    setProductSearchTerm(searchTerm);
    // updateProduct(index, 'name', searchTerm); // This line is removed
    
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
    // updateProduct(index, 'name', product.name); // This line is removed
    // updateProduct(index, 'description', product.description || ''); // This line is removed
    // updateProduct(index, 'price', product.price || 0); // This line is removed
    // updateProduct(index, 'image', product.image || ''); // This line is removed
    // updateProduct(index, 'productId', product._id); // This line is removed
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

  // Helper: check if address is confirmed (now from order.addressConfirmation.confirmed)
  const isAddressConfirmed = (order) => !!(order.addressConfirmation && order.addressConfirmation.confirmed);

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
      {/* This section is removed as per the edit hint */}

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
                  <td className="px-2 py-4 relative">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOrder(order)}
                      disabled={!isAddressConfirmed(order)}
                      onMouseEnter={() => setHoveredOrderId(order._id)}
                      onMouseLeave={() => setHoveredOrderId(null)}
                      aria-label={isAddressConfirmed(order) ? 'Select order' : 'Wait for admin to confirm the address'}
                    />
                    {!isAddressConfirmed(order) && hoveredOrderId === order._id && (
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-3 py-1 shadow-lg z-50 whitespace-nowrap">
                        Wait for admin to confirm the address.
                      </div>
                    )}
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
                          checked={!!(order.addressConfirmation && order.addressConfirmation.confirmed)}
                          onChange={async (e) => {
                            try {
                              // Optionally, prompt for a note
                              const notes = window.prompt('Add a note for address confirmation (optional):', order.addressConfirmation?.notes || '');
                              // You should pass the adminId from context/session; here we use employee?._id as a placeholder
                              await ordersAPI.patchOrderAddressConfirmation(order._id, { confirmed: e.target.checked, notes, adminId: employee?._id });
                              loadData();
                            } catch (err) {
                              alert('Failed to update address confirmation.');
                            }
                          }}
                          className="form-checkbox h-5 w-5 text-green-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Confirmed</span>
                        {order.addressConfirmation && order.addressConfirmation.confirmed && (
                          <span className="ml-2 text-xs text-gray-500">by {order.addressConfirmation.confirmedBy?.name || 'Admin'} on {order.addressConfirmation.confirmedAt ? new Date(order.addressConfirmation.confirmedAt).toLocaleString() : ''}</span>
                        )}
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

      {/* Delivery Status Update Modal removed after refactor */}
    </div>
  );
};

export default OrdersManagement; 
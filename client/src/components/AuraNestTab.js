import React, { useState, useEffect, useRef } from 'react';
import OrdersManagement from './OrdersManagement';
import TransactionsManagement from './TransactionsManagement';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Upload, 
  FileText,
  BarChart3,
  PieChart,
  Users,
  Download,
  Package,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  XCircle,
  User,
  Clock,
  Activity,
  Target,
  Zap,
  Star,
  Award,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import moment from 'moment';
import { employeeAPI, leadsAPI, ordersAPI, transactionsAPI } from '../services/api';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar
} from 'recharts';

const OrdersTab = ({
  orders,
  orderQuickForm,
  setOrderQuickForm,
  orderLoading,
  addressSuggestions,
  addressLoading,
  handleOrderQuickChange,
  handleOrderQuickSubmit,
  handleAddressInput,
  handleSelectAddress,
  handleCancelOrder
}) => {
  const phoneRef = useRef();
  const addressRef = useRef();
  const productRef = useRef();
  const notesRef = useRef();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
      <div className="w-full">
        <form onSubmit={e => handleOrderQuickSubmit(e, false)} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-4 flex flex-col md:flex-row md:items-end gap-4 mb-4">
          <input
            type="text"
            name="customerName"
            value={orderQuickForm.customerName}
            onChange={handleOrderQuickChange}
            placeholder="Name"
            className="input-field flex-1"
            required
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); phoneRef.current && phoneRef.current.focus(); } }}
          />
          <input
            type="text"
            name="customerPhone"
            value={orderQuickForm.customerPhone}
            onChange={handleOrderQuickChange}
            placeholder="Phone"
            className="input-field flex-1"
            required
            ref={phoneRef}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addressRef.current && addressRef.current.focus(); } }}
          />
          <div className="relative flex-1">
            <input
              type="text"
              name="customerAddress"
              value={orderQuickForm.customerAddress}
              onChange={handleAddressInput}
              placeholder="Address (auto-complete)"
              className="input-field w-full"
              required
              autoComplete="off"
              ref={addressRef}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); productRef.current && productRef.current.focus(); } }}
            />
            {addressLoading && <div className="absolute right-2 top-2 text-xs text-gray-400">Loading...</div>}
            {addressSuggestions && addressSuggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                {addressSuggestions.map(feature => (
                  <li key={feature.id} className="px-4 py-2 hover:bg-blue-100 cursor-pointer" onClick={() => handleSelectAddress(feature)}>
                    {feature.place_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="text"
            name="productName"
            value={orderQuickForm.productName}
            onChange={handleOrderQuickChange}
            placeholder="Product Name"
            className="input-field flex-1"
            required
            ref={productRef}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); notesRef.current && notesRef.current.focus(); } }}
          />
          <input
            type="text"
            name="notes"
            value={orderQuickForm.notes}
            onChange={handleOrderQuickChange}
            placeholder="Special Notes"
            className="input-field flex-1"
            ref={notesRef}
          />
          <div className="flex flex-col gap-2 md:flex-row md:gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">Save</button>
            <button type="button" onClick={e => handleOrderQuickSubmit(e, true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">Save & New</button>
          </div>
        </form>
      </div>
      <div className="card overflow-x-auto rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 mt-4">
        {orderLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order._id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.products && order.products[0] ? order.products[0].name : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.notes || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const AuraNestTab = ({ employee }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderAnalytics, setOrderAnalytics] = useState({});
  const [transactionAnalytics, setTransactionAnalytics] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('transaction');
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({
    startDate: moment().startOf('month').format('YYYY-MM-DD'),
    endDate: moment().endOf('month').format('YYYY-MM-DD'),
    type: '',
    category: '',
    vendor: '',
    paymentMethod: ''
  });
  const [transactionForm, setTransactionForm] = useState({
    date: moment().format('YYYY-MM-DD'),
    type: 'expense',
    amount: '',
    category: '',
    vendor: '',
    paymentMethod: '',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [vendorForm, setVendorForm] = useState({
    name: '',
    type: 'supplier',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    bankAccountNumber: '',
    bankName: '',
    branchCode: '',
    notes: ''
  });
  const [vendorError, setVendorError] = useState('');
  const [editingVendor, setEditingVendor] = useState(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const [categoryAnalytics, setCategoryAnalytics] = useState({});
  const [inventory, setInventory] = useState([]);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerContact: '',
    products: [{ name: '', description: '', attributes: {}, cost: '', price: '' }],
    notes: ''
  });

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('');
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3ViaGFuMzIzMjMiLCJhIjoiY21jazN0M3M2MGJyODJrcXh2eDhud3RubyJ9.oCTz3PbwjaF1GL_93hd3zQ';
  const [orderQuickForm, setOrderQuickForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    addressDetails: {},
    productName: '',
    notes: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  // Add new state for jewelry business
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leadForm, setLeadForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    productName: '',
    expectedPrice: '',
    assignedEmployee: '',
    status: 'new',
    notes: ''
  });

  // Determine if user is admin
  const isAdmin = employee && employee.role && employee.role.toLowerCase().includes('admin');

  useEffect(() => {
    loadData();
    loadCategoryAnalytics();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'inventory') loadInventory();
    
    // Set up real-time updates for dashboard
    const interval = setInterval(() => {
      if (activeTab === 'dashboard') {
        loadData();
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (modalType === 'transaction' && selectedItem) {
      setTransactionForm({
        date: selectedItem.date ? moment(selectedItem.date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
        type: selectedItem.type || 'expense',
        amount: selectedItem.amount || '',
        category: selectedItem.category?._id || '',
        vendor: selectedItem.vendor?._id || '',
        paymentMethod: selectedItem.paymentMethod?._id || '',
        description: selectedItem.description || ''
      });
    } else if (modalType === 'transaction') {
      setTransactionForm({
        date: moment().format('YYYY-MM-DD'),
        type: 'expense',
        amount: '',
        category: '',
        vendor: '',
        paymentMethod: '',
        description: ''
      });
    }
  }, [modalType, selectedItem]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsRes, categoriesRes, paymentMethodsRes, vendorsRes, analyticsRes, leadsRes, employeesRes] = await Promise.all([
        fetch(`/api/aura-nest/transactions?${new URLSearchParams(filters)}`).then(res => res.json()),
        fetch('/api/aura-nest/categories').then(res => res.json()),
        fetch('/api/aura-nest/payment-methods').then(res => res.json()),
        fetch('/api/aura-nest/vendors').then(res => res.json()),
        fetch(`/api/aura-nest/analytics/summary?${new URLSearchParams(filters)}`).then(res => res.json()),
        fetch('/api/leads').then(res => res.json()),
        fetch('/api/employees').then(res => res.json())
      ]);

      setTransactions(transactionsRes.transactions || []);
      setCategories(categoriesRes);
      setPaymentMethods(paymentMethodsRes);
      setVendors(vendorsRes);
      setAnalytics(analyticsRes);
      setLeads(leadsRes.leads || leadsRes || []);
      setEmployees(employeesRes);
    } catch (error) {
      console.error('Error loading Aura Nest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryAnalytics = async () => {
    try {
      const res = await fetch(`/api/aura-nest/analytics/categories?${new URLSearchParams(filters)}`);
      const data = await res.json();
      setCategoryAnalytics(data);
    } catch (err) {
      setCategoryAnalytics({});
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!transactionForm.date || !transactionForm.type || !transactionForm.amount || !transactionForm.category || !transactionForm.paymentMethod) {
      setFormError('Please fill all required fields.');
      return;
    }
    try {
      const payload = {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
      };
      let res;
      if (selectedItem && selectedItem._id) {
        res = await fetch(`/api/aura-nest/transactions/${selectedItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/aura-nest/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      if (!res.ok) throw new Error('Failed to save transaction');
      closeModal();
      loadData();
    } catch (err) {
      setFormError('Error: ' + err.message);
    }
  };

  const openAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      name: '',
      type: 'supplier',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      bankAccountNumber: '',
      bankName: '',
      branchCode: '',
      notes: ''
    });
    setVendorError('');
    setShowVendorForm(true);
  };

  const openEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name || '',
      type: vendor.type || 'supplier',
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      bankAccountNumber: vendor.bankDetails?.accountNumber || '',
      bankName: vendor.bankDetails?.bankName || '',
      branchCode: vendor.bankDetails?.branchCode || '',
      notes: vendor.notes || ''
    });
    setVendorError('');
    setShowVendorForm(true);
  };

  const closeVendorForm = () => {
    setShowVendorForm(false);
    setEditingVendor(null);
    setVendorError('');
  };

  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    setVendorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    setVendorError('');
    if (!vendorForm.name || !vendorForm.type) {
      setVendorError('Name and type are required.');
      return;
    }
    try {
      const payload = {
        name: vendorForm.name,
        type: vendorForm.type,
        contactPerson: vendorForm.contactPerson,
        phone: vendorForm.phone,
        email: vendorForm.email,
        address: vendorForm.address,
        bankDetails: {
          accountNumber: vendorForm.bankAccountNumber,
          bankName: vendorForm.bankName,
          branchCode: vendorForm.branchCode
        },
        notes: vendorForm.notes
      };
      let res;
      if (editingVendor && editingVendor._id) {
        res = await fetch(`/api/aura-nest/vendors/${editingVendor._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/aura-nest/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      if (!res.ok) throw new Error('Failed to save vendor');
      closeVendorForm();
      loadData();
    } catch (err) {
      setVendorError('Error: ' + err.message);
    }
  };

  const handleImportFileChange = (e) => {
    setImportFile(e.target.files[0]);
    setImportResult(null);
    setImportError('');
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImportResult(null);
    setImportError('');
    if (!importFile) {
      setImportError('Please select a CSV file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const res = await fetch('/api/aura-nest/import/transactions', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Import failed');
      setImportResult(data);
      setImportFile(null);
      loadData();
    } catch (err) {
      setImportError('Error: ' + err.message);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await fetch(`/api/aura-nest/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete transaction');
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Date','Type','Category','Amount','Vendor','Payment Method','Description'],
      ...transactions.map(t => [
        moment(t.date).format('YYYY-MM-DD'),
        t.type,
        t.category?.name || '',
        t.amount,
        t.vendor?.name || '',
        t.paymentMethod?.name || '',
        t.description || ''
      ])
    ];
    const csvContent = csvRows.map(row => row.map(String).map(v => '"'+v.replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${moment().format('YYYYMMDD_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadOrders = async () => {
    setOrderLoading(true);
    try {
      const res = await fetch('/api/inventory/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setOrders([]);
    } finally {
      setOrderLoading(false);
    }
  };

  const loadInventory = async () => {
    setOrderLoading(true);
    try {
      const res = await fetch('/api/inventory/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      setInventory([]);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleOrderProductChange = (idx, field, value) => {
    setOrderForm((prev) => {
      const products = [...prev.products];
      products[idx] = { ...products[idx], [field]: value };
      return { ...prev, products };
    });
  };

  const addOrderProduct = () => {
    setOrderForm((prev) => ({ ...prev, products: [...prev.products, { name: '', description: '', attributes: {}, cost: '', price: '' }] }));
  };

  const removeOrderProduct = (idx) => {
    setOrderForm((prev) => ({ ...prev, products: prev.products.filter((_, i) => i !== idx) }));
  };

  const handleOrderFormChange = (e) => {
    setOrderForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderError('');
    if (!orderForm.customerName || orderForm.products.some(p => !p.name || !p.cost || !p.price)) {
      setOrderError('Please fill all required fields.');
      return;
    }
    try {
      const payload = {
        customerName: orderForm.customerName,
        customerContact: orderForm.customerContact,
        products: orderForm.products.map(p => ({
          name: p.name,
          description: p.description,
          attributes: p.attributes,
          cost: parseFloat(p.cost),
          price: parseFloat(p.price)
        })),
        notes: orderForm.notes
      };
      const res = await fetch('/api/inventory/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add order');
      setShowOrderForm(false);
      setOrderForm({ customerName: '', customerContact: '', products: [{ name: '', description: '', attributes: {}, cost: '', price: '' }], notes: '' });
      loadOrders();
      loadInventory();
    } catch (err) {
      setOrderError('Error: ' + err.message);
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const res = await fetch(`/api/inventory/orders/${id}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to cancel order');
      loadOrders();
      loadInventory();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleReturnProduct = async (id) => {
    if (!window.confirm('Mark this product as returned?')) return;
    try {
      const res = await fetch(`/api/inventory/products/${id}/return`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to return product');
      loadInventory();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Address autocomplete handler
  const handleAddressInput = async (e) => {
    const value = e.target.value;
    setOrderQuickForm(prev => ({ ...prev, customerAddress: value }));
    if (!value) {
      setAddressSuggestions([]);
      return;
    }
    setAddressLoading(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&country=pk`);
      const data = await res.json();
      setAddressSuggestions(data.features || []);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setAddressLoading(false);
    }
  };
  const handleSelectAddress = (feature) => {
    setOrderQuickForm(prev => ({ ...prev, customerAddress: feature.place_name, addressDetails: feature }));
    setAddressSuggestions([]);
  };
  const handleOrderQuickChange = (e) => {
    setOrderQuickForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleOrderQuickSubmit = async (e, saveAndNew = false) => {
    e.preventDefault();
    // Validate required fields
    if (!orderQuickForm.customerName || !orderQuickForm.customerPhone || !orderQuickForm.customerAddress || !orderQuickForm.productName) {
      alert('Please fill all required fields.');
      return;
    }
    // Save as a single-product order
    try {
      const payload = {
        customerName: orderQuickForm.customerName,
        customerContact: orderQuickForm.customerPhone,
        products: [{ name: orderQuickForm.productName, description: '', attributes: {}, cost: 0, price: 0 }],
        notes: orderQuickForm.notes,
        address: orderQuickForm.customerAddress,
        addressDetails: orderQuickForm.addressDetails
      };
      const res = await fetch('/api/inventory/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add order');
      if (saveAndNew) {
        setOrderQuickForm({ customerName: '', customerPhone: '', customerAddress: '', addressDetails: {}, productName: '', notes: '' });
      } else {
        alert('Order saved!');
      }
      loadOrders();
      loadInventory();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const DashboardTab = () => {
    // Sample data for charts - replace with real data from your APIs
    const monthlyData = [
      { month: 'Jan', income: 45000, expenses: 32000, profit: 13000 },
      { month: 'Feb', income: 52000, expenses: 38000, profit: 14000 },
      { month: 'Mar', income: 48000, expenses: 35000, profit: 13000 },
      { month: 'Apr', income: 61000, expenses: 42000, profit: 19000 },
      { month: 'May', income: 55000, expenses: 39000, profit: 16000 },
      { month: 'Jun', income: 67000, expenses: 45000, profit: 22000 },
    ];

    const categoryData = [
      { name: 'Gold Jewelry', value: 45, color: '#FFD700' },
      { name: 'Diamond Items', value: 25, color: '#B9F2FF' },
      { name: 'Silver Jewelry', value: 20, color: '#C0C0C0' },
      { name: 'Pearl Items', value: 10, color: '#F0E68C' },
    ];

    const leadSourceData = [
      { name: 'TikTok', leads: 45, conversions: 12, color: '#000000' },
      { name: 'Meta Ads', leads: 38, conversions: 15, color: '#1877F2' },
      { name: 'WhatsApp', leads: 52, conversions: 28, color: '#25D366' },
      { name: 'Referral', leads: 15, conversions: 8, color: '#FF6B6B' },
      { name: 'Website', leads: 22, conversions: 6, color: '#4ECDC4' },
    ];

    const orderStatusData = [
      { status: 'Pending', count: 8, color: '#F59E0B' },
      { status: 'Processing', count: 12, color: '#3B82F6' },
      { status: 'Shipped', count: 15, color: '#8B5CF6' },
      { status: 'Delivered', count: 32, color: '#10B981' },
      { status: 'Failed', count: 3, color: '#EF4444' },
    ];

    const recentTransactions = [
      { id: 1, type: 'income', amount: 25000, description: 'Gold Ring Sale', date: '2024-01-15', status: 'completed' },
      { id: 2, type: 'expense', amount: 8000, description: 'Supplier Payment', date: '2024-01-14', status: 'pending' },
      { id: 3, type: 'income', amount: 45000, description: 'Diamond Necklace', date: '2024-01-13', status: 'completed' },
      { id: 4, type: 'expense', amount: 12000, description: 'Marketing Ads', date: '2024-01-12', status: 'approved' },
    ];

    return (
      <div className="space-y-8">
        {/* Hero Section with Live Stats */}
        <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">💎 Aura Nest Financial Hub</h1>
              <p className="text-xl text-purple-200">Complete Business Intelligence Dashboard</p>
              <p className="text-sm text-purple-300 mt-2">Real-time insights for your jewellery business</p>
            </div>
            
            {/* Live Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="text-3xl font-bold text-green-400 animate-pulse">PKR{analytics.totalIncome?.toLocaleString() || '125,000'}</div>
                <div className="text-sm text-purple-200">Total Revenue</div>
                <div className="text-xs text-green-300 mt-1">↗ +12.5% this month</div>
                <div className="mt-2">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="text-3xl font-bold text-blue-400">PKR{analytics.totalExpense?.toLocaleString() || '78,000'}</div>
                <div className="text-sm text-purple-200">Total Expenses</div>
                <div className="text-xs text-blue-300 mt-1">↘ -5.2% this month</div>
                <div className="mt-2">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{width: '62%'}}></div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="text-3xl font-bold text-yellow-400">PKR{analytics.netIncome?.toLocaleString() || '47,000'}</div>
                <div className="text-sm text-purple-200">Net Profit</div>
                <div className="text-xs text-yellow-300 mt-1">↗ +18.7% this month</div>
                <div className="mt-2">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{width: '38%'}}></div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="text-3xl font-bold text-purple-400">{analytics.transactionCount || '156'}</div>
                <div className="text-sm text-purple-200">Transactions</div>
                <div className="text-xs text-purple-300 mt-1">↗ +8.3% this month</div>
                <div className="mt-2">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-purple-400 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => openModal('transaction')}
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
          >
        <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 group-hover:rotate-90 transition-transform duration-300" />
              <div className="font-semibold">Add Transaction</div>
              <div className="text-sm opacity-90">Record Income/Expense</div>
        </div>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
          >
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 group-hover:bounce transition-all duration-300" />
              <div className="font-semibold">Orders</div>
              <div className="text-sm opacity-90">Track Deliveries</div>
      </div>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
          >
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
              <div className="font-semibold">Leads</div>
              <div className="text-sm opacity-90">Manage Prospects</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
          >
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 group-hover:rotate-12 transition-transform duration-300" />
              <div className="font-semibold">Transactions</div>
              <div className="text-sm opacity-90">View All Records</div>
            </div>
          </button>
        </div>

        {/* Weather & Time Widget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">Multan</div>
                <div className="text-sm opacity-90">Punjab, Pakistan</div>
                <div className="text-4xl font-bold mt-2">28°C</div>
                <div className="text-sm opacity-90">Partly Cloudy</div>
              </div>
              <div className="text-6xl">☀️</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-400 to-pink-600 rounded-3xl p-6 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">Current Time</div>
              <div className="text-4xl font-mono font-bold mb-2">
                {new Date().toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              <div className="text-sm opacity-90">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-400 to-teal-600 rounded-3xl p-6 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">System Status</div>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold">All Systems Operational</span>
              </div>
              <div className="text-sm opacity-90">Uptime: 99.9%</div>
              <div className="text-sm opacity-90">Last Updated: 2 min ago</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <LineChartIcon className="h-6 w-6 mr-2 text-blue-600" />
                Monthly Revenue Trend
              </h3>
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors cursor-pointer">Income</span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200 transition-colors cursor-pointer">Expenses</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer">Profit</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                  animationDuration={2000}
                  animationBegin={0}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2 }}
                  animationDuration={2000}
                  animationBegin={500}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                  animationDuration={2000}
                  animationBegin={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <PieChart className="h-6 w-6 mr-2 text-purple-600" />
              Product Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={2000}
                  animationBegin={0}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources & Order Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lead Sources Performance */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Lead Sources Performance</h3>
            <div className="space-y-4">
              {leadSourceData.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    ></div>
                    <div>
                      <div className="font-semibold text-gray-800">{source.name}</div>
                      <div className="text-sm text-gray-600">{source.leads} leads • {source.conversions} conversions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">
                      {source.conversions > 0 ? Math.round((source.conversions / source.leads) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">conversion rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Status Overview */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Order Status Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity & Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Recent Transactions</h3>
              <button 
                onClick={() => setActiveTab('transactions')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{transaction.description}</div>
                      <div className="text-sm text-gray-600">{transaction.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      PKR{transaction.amount.toLocaleString()}
                    </div>
                    <div className={`text-sm px-2 py-1 rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Metrics</h3>
            <div className="space-y-6">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                <div className="text-3xl font-bold text-green-600">85%</div>
                <div className="text-sm text-green-700">Lead Conversion Rate</div>
                <div className="text-xs text-green-600 mt-1">↗ +5.2% vs last month</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600">92%</div>
                <div className="text-sm text-blue-700">Order Success Rate</div>
                <div className="text-xs text-blue-600 mt-1">↗ +2.1% vs last month</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                <div className="text-3xl font-bold text-purple-600">PKR47K</div>
                <div className="text-sm text-purple-700">Average Order Value</div>
                <div className="text-xs text-purple-600 mt-1">↗ +8.7% vs last month</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl">
                <div className="text-3xl font-bold text-orange-600">2.3</div>
                <div className="text-sm text-orange-700">Days Avg Delivery</div>
                <div className="text-xs text-orange-600 mt-1">↘ -0.5 days vs last month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Insights */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">💡 Business Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-800">Revenue Growth</div>
                  <div className="text-sm text-gray-600">Strong upward trend</div>
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                Your revenue has increased by 12.5% this month. TikTok ads are showing the highest conversion rates at 26.7%.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
          </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-800">Order Efficiency</div>
                  <div className="text-sm text-gray-600">Excellent performance</div>
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                Order delivery time has improved by 0.5 days. 92% of orders are delivered successfully within 3 days.
              </p>
        </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
            </div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-800">Lead Quality</div>
                  <div className="text-sm text-gray-600">High conversion rates</div>
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                Lead quality has improved significantly. WhatsApp leads show the highest conversion rate at 53.8%.
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">🔄 Real-time Activity Feed</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Updates</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">New Order Received</div>
                <div className="text-sm text-gray-600">Gold Ring order worth PKR25,000 from Customer #1234</div>
                <div className="text-xs text-gray-500 mt-1">2 minutes ago</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">+PKR25,000</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
            <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
            </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Order Shipped</div>
                <div className="text-sm text-gray-600">Diamond Necklace order #ORD-789 shipped via TCS</div>
                <div className="text-xs text-gray-500 mt-1">5 minutes ago</div>
            </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">TRK-123456</div>
          </div>
        </div>

            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
            <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
            </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">New Lead Qualified</div>
                <div className="text-sm text-gray-600">Lead from TikTok with score 9/10 - ready for order</div>
                <div className="text-xs text-gray-500 mt-1">8 minutes ago</div>
            </div>
              <div className="text-right">
                <div className="text-sm font-medium text-purple-600">Score: 9/10</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-xl border-l-4 border-orange-500">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Payment Received</div>
                <div className="text-sm text-gray-600">Full payment received for Silver Bracelet order</div>
                <div className="text-xs text-gray-500 mt-1">12 minutes ago</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-orange-600">PKR8,000</div>
              </div>
          </div>
        </div>
      </div>

        {/* Achievement Badges */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border border-yellow-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">🏆 Achievement Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-shadow">
                <Star className="h-8 w-8 text-white" />
            </div>
              <div className="font-semibold text-gray-800">Top Performer</div>
              <div className="text-sm text-gray-600">Revenue Leader</div>
            </div>
            
            <div className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <div className="bg-gradient-to-br from-green-400 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-shadow">
                <Target className="h-8 w-8 text-white" />
          </div>
              <div className="font-semibold text-gray-800">Goal Crusher</div>
              <div className="text-sm text-gray-600">Target Achieved</div>
            </div>
            
            <div className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
            </div>
              <div className="font-semibold text-gray-800">Speed Demon</div>
              <div className="text-sm text-gray-600">Fast Delivery</div>
            </div>
            
            <div className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <div className="bg-gradient-to-br from-red-400 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-shadow">
                <Award className="h-8 w-8 text-white" />
          </div>
              <div className="font-semibold text-gray-800">Quality Master</div>
              <div className="text-sm text-gray-600">5-Star Service</div>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <div className="relative">
        <button
              onClick={() => openModal('transaction')}
              className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
            >
              <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              3
            </div>
            </div>
          </div>

        {/* Notification Toast */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl transform translate-x-full animate-slide-in">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6" />
              <div>
                <div className="font-semibold">Success!</div>
                <div className="text-sm opacity-90">Dashboard updated successfully</div>
            </div>
            </div>
          </div>
      </div>
    </div>
  );
  };

  const VendorsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Vendors</h2>
        <button
          onClick={openAddVendor}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </button>
      </div>
      {/* Vendor Form */}
      {showVendorForm && (
        <div className="card p-6 mb-6">
          <form onSubmit={handleVendorSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" name="name" value={vendorForm.name} onChange={handleVendorChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select name="type" value={vendorForm.type} onChange={handleVendorChange} className="input-field" required>
                  <option value="supplier">Supplier</option>
                  <option value="service_provider">Service Provider</option>
                  <option value="courier">Courier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input type="text" name="contactPerson" value={vendorForm.contactPerson} onChange={handleVendorChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="text" name="phone" value={vendorForm.phone} onChange={handleVendorChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" value={vendorForm.email} onChange={handleVendorChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" name="address" value={vendorForm.address} onChange={handleVendorChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                <input type="text" name="bankAccountNumber" value={vendorForm.bankAccountNumber} onChange={handleVendorChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <input type="text" name="bankName" value={vendorForm.bankName} onChange={handleVendorChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Branch Code</label>
                <input type="text" name="branchCode" value={vendorForm.branchCode} onChange={handleVendorChange} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <input type="text" name="notes" value={vendorForm.notes} onChange={handleVendorChange} className="input-field" />
              </div>
            </div>
            {vendorError && <div className="text-red-600 text-sm">{vendorError}</div>}
            <div className="flex justify-end space-x-3 mt-4">
              <button type="button" onClick={closeVendorForm} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">
                {editingVendor ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Vendor Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors.map((vendor) => (
              <tr key={vendor._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.type.replace('_', ' ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.contactPerson || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.bankDetails ? `${vendor.bankDetails.bankName || ''} (${vendor.bankDetails.accountNumber || ''})` : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.notes || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openEditVendor(vendor)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vendors.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No vendors found</p>
          </div>
        )}
      </div>
    </div>
  );

  const ReportsTab = () => {
    // Prepare data for charts
    const pieData = Object.entries(categoryAnalytics).map(([cat, val]) => ({
      name: cat,
      value: (val.income || 0) + (val.expense || 0),
      income: val.income || 0,
      expense: val.expense || 0,
      count: val.count || 0
    }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#F87171', '#FBBF24', '#34D399', '#60A5FA'];
    // Prepare trend data
    const trendMap = {};
    transactions.forEach(t => {
      const d = moment(t.date).format('YYYY-MM-DD');
      if (!trendMap[d]) trendMap[d] = { date: d, income: 0, expense: 0 };
      if (t.type === 'income') trendMap[d].income += t.amount;
      else trendMap[d].expense += t.amount;
    });
    const trendData = Object.values(trendMap).sort((a,b) => a.date.localeCompare(b.date));
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <button
            onClick={handleExportCSV}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Total Income</div>
                <div className="text-xl font-bold text-gray-900">PKR{analytics.totalIncome?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <TrendingDown className="h-6 w-6 text-red-600 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Total Expenses</div>
                <div className="text-xl font-bold text-gray-900">PKR{analytics.totalExpense?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Net Income</div>
                <div className={`text-xl font-bold ${analytics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>PKR{analytics.netIncome?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <div className="text-sm text-gray-600">Transactions</div>
                <div className="text-xl font-bold text-gray-900">{analytics.transactionCount || 0}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Category Breakdown Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `PKR${value.toLocaleString()}`} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        {/* Trends Line Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income & Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `PKR${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10B981" name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const InventoryTab = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          {/* Always-visible Add Product Form */}
          <form onSubmit={handleAddProductSubmit} className="card p-6 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input type="text" name="name" value={productForm.name} onChange={handleProductFormChange} className="input-field" required onKeyDown={handleProductFormKeyDown('description')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" name="description" value={productForm.description} onChange={handleProductFormChange} className="input-field" onKeyDown={handleProductFormKeyDown('category')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input type="text" name="category" value={productForm.category} onChange={handleProductFormChange} className="input-field" onKeyDown={handleProductFormKeyDown('quantity')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" name="quantity" value={productForm.quantity} onChange={handleProductFormChange} className="input-field" min="0" required onKeyDown={handleProductFormKeyDown('cost')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost</label>
                <input type="number" name="cost" value={productForm.cost} onChange={handleProductFormChange} className="input-field" min="0" required onKeyDown={handleProductFormKeyDown('price')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input type="number" name="price" value={productForm.price} onChange={handleProductFormChange} className="input-field" min="0" required onKeyDown={handleProductFormKeyDown('submit')} />
              </div>
            </div>
            {productFormError && <div className="text-red-600 text-sm">{productFormError}</div>}
            <div className="flex justify-end space-x-3 mt-4">
              <button type="button" onClick={handleProductFormCancel} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">Cancel</button>
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">Save</button>
            </div>
          </form>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventory.filter(item => item.status === 'in_stock').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventory.filter(item => item.status === 'low_stock').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventory.filter(item => item.status === 'out_of_stock').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
            <div className="flex space-x-2">
          <select
            value={inventoryStatusFilter}
                onChange={(e) => setInventoryStatusFilter(e.target.value)}
                className="input-field"
          >
                <option value="">All Status</option>
            <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
            </div>
          {inventory.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {inventory
                    .filter(item => !inventoryStatusFilter || item.status === inventoryStatusFilter)
                    .map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={product.image || '/placeholder.png'} alt={product.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">PKR{product.cost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">PKR{product.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                          product.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.orderId ? product.orderId.customerName : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {product.status !== 'returned' && product.status !== 'cancelled' && (
                        <button
                          onClick={() => handleReturnProduct(product._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No inventory items found.</div>
          )}
        </div>
      </div>
    );
  };

  // Lead Management Tab Component
  const LeadsTab = () => {
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [leadForm, setLeadForm] = useState({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      productInterest: '',
      expectedPrice: '',
      assignedEmployee: '',
      status: 'new',
      source: '',
      notes: '',
      followUpDate: ''
    });
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [leadsError, setLeadsError] = useState('');

    const handleLeadChange = (e) => {
      const { name, value } = e.target;
      setLeadForm(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleLeadSubmit = async (e) => {
      e.preventDefault();
      try {
        setLeadsLoading(true);
        setLeadsError('');
        
        if (editingLead) {
          await leadsAPI.update(editingLead._id, leadForm);
        } else {
          await leadsAPI.create(leadForm);
        }
        
        // Refresh leads data
        loadData();
        setShowLeadForm(false);
        setLeadForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          productInterest: '',
          expectedPrice: '',
          assignedEmployee: '',
          status: 'new',
          source: '',
          notes: '',
          followUpDate: ''
        });
        setEditingLead(null);
      } catch (error) {
        console.error('Error saving lead:', error);
        setLeadsError(error.response?.data?.error || 'Failed to save lead');
      } finally {
        setLeadsLoading(false);
      }
    };

    const openLeadForm = (lead = null) => {
      if (lead) {
        setEditingLead(lead);
        setLeadForm({
          ...lead,
          assignedEmployee: lead.assignedEmployee ? (typeof lead.assignedEmployee === 'object' ? lead.assignedEmployee._id : lead.assignedEmployee) : '',
          expectedPrice: lead.expectedPrice || '',
          followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ''
        });
      } else {
        setEditingLead(null);
        setLeadForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          productInterest: '',
          expectedPrice: '',
          assignedEmployee: '',
          status: 'new',
          source: '',
          notes: '',
          followUpDate: ''
        });
      }
      setShowLeadForm(true);
    };

    const closeLeadForm = () => {
      setShowLeadForm(false);
      setEditingLead(null);
      setLeadsError('');
    };

    const handleDeleteLead = async (leadId) => {
      if (window.confirm('Are you sure you want to delete this lead?')) {
        try {
          setLeadsLoading(true);
          await leadsAPI.delete(leadId);
          loadData(); // Refresh leads data
        } catch (error) {
          console.error('Error deleting lead:', error);
          setLeadsError('Failed to delete lead');
        } finally {
          setLeadsLoading(false);
        }
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'new': return 'bg-blue-100 text-blue-800';
        case 'contacted': return 'bg-yellow-100 text-yellow-800';
        case 'qualified': return 'bg-green-100 text-green-800';
        case 'proposal': return 'bg-purple-100 text-purple-800';
        case 'negotiation': return 'bg-orange-100 text-orange-800';
        case 'closed_won': return 'bg-green-100 text-green-800';
        case 'closed_lost': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
          <button
            onClick={() => openLeadForm()}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </button>
        </div>

        {/* Lead Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Won</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(lead => lead.status === 'closed_won').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(lead => !lead.status.includes('closed')).length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(lead => lead.status === 'closed_lost').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {leadsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{leadsError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lead Pipeline</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search leads..."
                className="input-field"
              />
              <select className="input-field">
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed_won">Won</option>
                <option value="closed_lost">Lost</option>
              </select>
            </div>
          </div>
          
          {leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Interest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow Up</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead._id || lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.customerName || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{lead.source || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{lead.customerPhone || '-'}</div>
                          <div className="text-sm text-gray-500">{lead.customerEmail || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.productInterest || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">PKR{lead.expectedPrice || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.assignedEmployee ? (typeof lead.assignedEmployee === 'object' ? lead.assignedEmployee.name : lead.assignedEmployee) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openLeadForm(lead)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead._id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={leadsLoading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No leads found</p>
              <p className="text-sm text-gray-400">Start by adding your first lead</p>
            </div>
          )}
        </div>

        {/* Lead Form Modal */}
        {showLeadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h3>
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <input
                      type="text"
                      name="customerName"
                      value={leadForm.customerName}
                      onChange={handleLeadChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={leadForm.customerPhone}
                      onChange={handleLeadChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={leadForm.customerEmail}
                      onChange={handleLeadChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Interest</label>
                    <input
                      type="text"
                      name="productInterest"
                      value={leadForm.productInterest}
                      onChange={handleLeadChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Price</label>
                    <input
                      type="number"
                      name="expectedPrice"
                      value={leadForm.expectedPrice}
                      onChange={handleLeadChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Employee</label>
                    <select
                      name="assignedEmployee"
                      value={leadForm.assignedEmployee}
                      onChange={handleLeadChange}
                      className="input-field"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      value={leadForm.status}
                      onChange={handleLeadChange}
                      className="input-field"
                      required
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="closed_won">Won</option>
                      <option value="closed_lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <input
                      type="text"
                      name="source"
                      value={leadForm.source}
                      onChange={handleLeadChange}
                      className="input-field"
                      placeholder="e.g., Website, Referral, Social Media"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Follow Up Date</label>
                    <input
                      type="date"
                      name="followUpDate"
                      value={leadForm.followUpDate}
                      onChange={handleLeadChange}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={leadForm.notes}
                    onChange={handleLeadChange}
                    className="input-field"
                    rows="3"
                    placeholder="Additional notes about this lead..."
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeLeadForm}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    disabled={leadsLoading}
                  >
                    {leadsLoading ? 'Saving...' : (editingLead ? 'Update' : 'Add') + ' Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Profit Analytics Tab Component
  const ProfitAnalyticsTab = () => {
    const [profitData, setProfitData] = useState({
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      netProfit: 0,
      profitMargin: 0,
      monthlyData: [],
      categoryBreakdown: []
    });

    const [dateRange, setDateRange] = useState({
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
      endDate: moment().endOf('month').format('YYYY-MM-DD')
    });

    // Calculate profit data from transactions
    useEffect(() => {
      const filteredTransactions = transactions.filter(t => {
        const transactionDate = moment(t.date);
        return transactionDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
      });

      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const grossProfit = income - expenses;
      const profitMargin = income > 0 ? (grossProfit / income) * 100 : 0;

      // Calculate category breakdown
      const categoryMap = {};
      filteredTransactions.forEach(t => {
        const categoryName = categories.find(c => c._id === t.category)?.name || 'Unknown';
        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
          categoryMap[categoryName].income += t.amount || 0;
        } else {
          categoryMap[categoryName].expense += t.amount || 0;
        }
      });

      const categoryBreakdown = Object.entries(categoryMap).map(([name, data]) => ({
        name,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense
      }));

      // Calculate monthly data for the last 6 months
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = moment().subtract(i, 'months');
        const monthStart = month.startOf('month');
        const monthEnd = month.endOf('month');
        
        const monthTransactions = transactions.filter(t => {
          const transactionDate = moment(t.date);
          return transactionDate.isBetween(monthStart, monthEnd, 'day', '[]');
        });

        const monthIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const monthExpenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        monthlyData.push({
          month: month.format('MMM YYYY'),
          income: monthIncome,
          expenses: monthExpenses,
          profit: monthIncome - monthExpenses
        });
      }

      setProfitData({
        totalRevenue: income,
        totalCost: expenses,
        grossProfit,
        netProfit: grossProfit, // Simplified for now
        profitMargin,
        monthlyData,
        categoryBreakdown
      });
    }, [transactions, categories, dateRange]);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Profit Analytics</h2>
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        {/* Profit Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">PKR{profitData.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">PKR{profitData.totalCost.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                <p className={`text-2xl font-bold ${profitData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  PKR{profitData.grossProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className={`text-2xl font-bold ${profitData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitData.profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Profit Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `PKR${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Profit Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={profitData.categoryBreakdown.filter(cat => cat.profit !== 0)}
                  dataKey="profit"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, profit }) => `${name}: PKR${profit.toLocaleString()}`}
                >
                  {profitData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `PKR${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Category Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profitData.categoryBreakdown.map((category) => (
                  <tr key={category.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">PKR{category.income.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">PKR{category.expense.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={category.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        PKR{category.profit.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={category.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {category.income > 0 ? ((category.profit / category.income) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-blue-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'leads'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-green-600'
          }`}
        >
          Lead Management
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-purple-600'
          }`}
        >
          Inventory
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('profit')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'profit'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-red-600'
            }`}
          >
            Profit Analytics
          </button>
        )}
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-orange-600'
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'transactions'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-indigo-600'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'transactions' && <TransactionsManagement isAdmin={isAdmin} />}
      {activeTab === 'vendors' && <VendorsTab />}
      {activeTab === 'reports' && <ReportsTab />}
      {activeTab === 'orders' && <OrdersManagement isAdmin={isAdmin} />}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'leads' && <LeadsTab />}
      {activeTab === 'profit' && <ProfitAnalyticsTab />}

      {/* Modal Placeholder */}
      {showModal && modalType === 'transaction' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedItem ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" name="date" value={transactionForm.date} onChange={handleTransactionChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select name="type" value={transactionForm.type} onChange={handleTransactionChange} className="input-field" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input type="number" name="amount" value={transactionForm.amount} onChange={handleTransactionChange} className="input-field" required min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select name="category" value={transactionForm.category} onChange={handleTransactionChange} className="input-field" required>
                    <option value="">Select Category</option>
                    {categories.filter(c => c.type === transactionForm.type).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <select name="vendor" value={transactionForm.vendor} onChange={handleTransactionChange} className="input-field">
                    <option value="">None</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select name="paymentMethod" value={transactionForm.paymentMethod} onChange={handleTransactionChange} className="input-field" required>
                    <option value="">Select Method</option>
                    {paymentMethods.map(pm => (
                      <option key={pm._id} value={pm._id}>{pm.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" name="description" value={transactionForm.description} onChange={handleTransactionChange} className="input-field" />
              </div>
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">
                  {selectedItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showModal && modalType === 'import' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Transactions (CSV)</h3>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <input type="file" accept=".csv" onChange={handleImportFileChange} className="input-field" />
              {importError && <div className="text-red-600 text-sm">{importError}</div>}
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">Import</button>
              </div>
            </form>
            {importResult && (
              <div className="mt-6">
                <div className="text-green-700 font-semibold mb-2">{importResult.message}</div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="text-red-600 text-sm">
                    <div>Some rows failed to import:</div>
                    <ul className="list-disc ml-6">
                      {importResult.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuraNestTab; 
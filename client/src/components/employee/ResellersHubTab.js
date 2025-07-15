import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Edit, Trash2, Loader2, Save, X, Search, ChevronDown, CheckSquare, Briefcase, Info, DollarSign, FileImage } from 'lucide-react';
import axios from 'axios';

const initialResellerClient = {
  name: '',
  email: '',
  phone: '',
  portal: '',
  labelType: 'standard',
  vendorRate: 0,
  clientRate: 0,
  labels: [],
  notes: ''
};

const ResellersHubTab = ({ employee }) => {
  const [activeResellerTab, setActiveResellerTab] = useState('labels');

  // Reseller Client State
  const [resellerClients, setResellerClients] = useState([]);
  const [resellerMetrics, setResellerMetrics] = useState({ totalClients: 0, totalLabels: 0, totalProfit: 0 });
  const [resellerMetricsLoading, setResellerMetricsLoading] = useState(false);
  const [resellerMetricsError, setResellerMetricsError] = useState('');
  const [clientForm, setClientForm] = useState(initialResellerClient);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientModalType, setClientModalType] = useState('add');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState('');

  // Transaction State
  const [resellerTransactions, setResellerTransactions] = useState([]);
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    transactionType: 'sale',
    notes: '',
    screenshot: ''
  });
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionError, setTransactionError] = useState('');
  const [transactionScreenshotFile, setTransactionScreenshotFile] = useState(null);
  const [transactionScreenshotPreview, setTransactionScreenshotPreview] = useState('');

  // Fetch Reseller Hub dashboard metrics
  useEffect(() => {
    setResellerMetricsLoading(true);
    setResellerMetricsError('');
    axios.get('/api/resellers/dashboard/summary')
      .then(res => {
        setResellerMetrics(res.data);
      })
      .catch(err => {
        setResellerMetricsError('Failed to load reseller metrics');
      })
      .finally(() => setResellerMetricsLoading(false));
  }, []);

  // Load reseller clients
  const loadResellerClients = useCallback(async () => {
    setClientLoading(true);
    setClientError('');
    try {
      const res = await axios.get('/api/resellers/clients');
      setResellerClients(res.data);
    } catch (err) {
      setClientError('Failed to load reseller clients');
    } finally {
      setClientLoading(false);
    }
  }, []);

  // Load reseller transactions
  const loadResellerTransactions = useCallback(async () => {
    setTransactionLoading(true);
    setTransactionError('');
    try {
      const res = await axios.get('/api/resellers/transactions');
      setResellerTransactions(res.data);
    } catch (err) {
      setTransactionError('Failed to load transactions.');
    } finally {
      setTransactionLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (activeResellerTab === 'labels') {
      loadResellerClients();
    } else if (activeResellerTab === 'transactions') {
      loadResellerTransactions();
    }
  }, [activeResellerTab, loadResellerClients, loadResellerTransactions]);

  const handleClientInput = (e) => {
    const { name, value } = e.target;
    setClientForm(f => ({ ...f, [name]: value }));
    setClientError('');
  };

  const openClientModal = (type, client = null) => {
    setClientModalType(type);
    setSelectedClient(client);
    setClientForm(client ? { ...client, notes: client.notes || '' } : initialResellerClient);
    setClientModalOpen(true);
  };
  const closeClientModal = () => {
    setClientModalOpen(false);
    setSelectedClient(null);
    setClientForm(initialResellerClient);
    setClientError('');
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setClientLoading(true);
    setClientError('');
    try {
      if (clientModalType === 'add') {
        await axios.post('/api/resellers/clients', clientForm);
      } else {
        await axios.put(`/api/resellers/clients/${selectedClient._id}`, clientForm);
      }
      closeClientModal();
      loadResellerClients();
    } catch (err) {
      setClientError(err.response?.data?.error || `Failed to ${clientModalType} client`);
    } finally {
      setClientLoading(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setClientLoading(true);
      try {
        await axios.delete(`/api/resellers/clients/${id}`);
        loadResellerClients();
      } catch (err) {
        setClientError('Failed to delete client.');
      } finally {
        setClientLoading(false);
      }
    }
  };

  // Transaction handlers
  const handleTransactionInput = (e) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTransactionScreenshot = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTransactionScreenshotFile(file);
      setTransactionScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setTransactionLoading(true);
    const formData = new FormData();
    formData.append('amount', transactionForm.amount);
    formData.append('transactionType', transactionForm.transactionType);
    formData.append('notes', transactionForm.notes);
    if (transactionScreenshotFile) {
      formData.append('screenshot', transactionScreenshotFile);
    }
    try {
      await axios.post('/api/resellers/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTransactionForm({ amount: '', transactionType: 'sale', notes: '', screenshot: '' });
      setTransactionScreenshotFile(null);
      setTransactionScreenshotPreview('');
      loadResellerTransactions();
    } catch (err) {
      setTransactionError('Failed to add transaction.');
    } finally {
      setTransactionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-yellow-500" />
              Resellers Hub
          </h2>
      </div>

      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeResellerTab === 'labels' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setActiveResellerTab('labels')}
        >
          Labels Management
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeResellerTab === 'transactions' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-green-600'}`}
          onClick={() => setActiveResellerTab('transactions')}
        >
          Transaction Management
        </button>
      </div>

      {activeResellerTab === 'labels' && (
          <div>
              {/* Client Management UI from USPSLabelsTabAdmin */}
          </div>
      )}
      {activeResellerTab === 'transactions' && (
          <div>
              {/* Transaction Management UI from USPSLabelsTabAdmin */}
          </div>
      )}
    </div>
  );
};

export default ResellersHubTab; 
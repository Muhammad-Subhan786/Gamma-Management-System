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
        <div className="space-y-6">
          {/* Dashboard metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center p-5 bg-gradient-to-br from-blue-100 to-blue-300 rounded-2xl shadow-md">
              <span className="material-icons text-blue-600 mr-4">label</span>
              <div>
                <div className="text-2xl font-bold text-blue-700">{resellerMetricsLoading ? '...' : resellerMetrics.totalLabels.toLocaleString()}</div>
                <div className="text-sm text-blue-800 font-medium">Total Labels</div>
              </div>
            </div>
            <div className="flex items-center p-5 bg-gradient-to-br from-green-100 to-green-300 rounded-2xl shadow-md">
              <span className="material-icons text-green-600 mr-4">attach_money</span>
              <div>
                <div className="text-2xl font-bold text-green-700">{resellerMetricsLoading ? '...' : `$${Number(resellerMetrics.totalProfit).toFixed(2)}`}</div>
                <div className="text-sm text-green-800 font-medium">Total Profit</div>
              </div>
            </div>
            <div className="flex items-center p-5 bg-gradient-to-br from-yellow-100 to-yellow-300 rounded-2xl shadow-md">
              <span className="material-icons text-yellow-600 mr-4">group</span>
              <div>
                <div className="text-2xl font-bold text-yellow-700">{resellerMetricsLoading ? '...' : resellerMetrics.totalClients}</div>
                <div className="text-sm text-yellow-800 font-medium">Total Clients</div>
              </div>
            </div>
          </div>
          {clientError && <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-4">{clientError}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Portal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Label Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Vendor Rate</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Client Rate</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Profit/Label</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Labels</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody>
                {clientLoading ? (
                  <tr><td colSpan={10} className="text-center p-4 text-gray-400">Loading...</td></tr>
                ) : resellerClients.length === 0 ? (
                  <tr><td colSpan={10} className="text-center p-4 text-gray-400">No reseller clients found.</td></tr>
                ) : resellerClients.map(client => (
                  <tr key={client._id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{client.name}</td>
                    <td className="p-2">{client.email}</td>
                    <td className="p-2">{client.phone}</td>
                    <td className="p-2">{client.portal}</td>
                    <td className="p-2">{client.labelType}</td>
                    <td className="p-2 text-right">${Number(client.vendorRate).toFixed(2)}</td>
                    <td className="p-2 text-right">${Number(client.clientRate).toFixed(2)}</td>
                    <td className="p-2 text-right font-semibold text-green-700">${(Number(client.clientRate) - Number(client.vendorRate)).toFixed(2)}</td>
                    <td className="p-2">{client.labels}</td>
                    <td className="p-2">{client.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeResellerTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-white/80 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Reseller Transactions</h3>
            {transactionError && <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-4">{transactionError}</div>}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionLoading ? (
                    <tr><td colSpan={5} className="text-center p-4 text-gray-400">Loading...</td></tr>
                  ) : resellerTransactions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-4 text-gray-400">No transactions found.</td></tr>
                  ) : resellerTransactions.map(tx => (
                    <tr key={tx._id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">${Number(tx.amount).toFixed(2)}</td>
                      <td className="p-2">{tx.transactionType}</td>
                      <td className="p-2">{tx.notes}</td>
                      <td className="p-2">
                        {tx.screenshot ? (
                          <a href={`/api/resellers/screenshot/${tx.screenshot}`} target="_blank" rel="noopener noreferrer">
                            <img src={`/api/resellers/screenshot/${tx.screenshot}`} alt="Screenshot" className="h-12 rounded shadow border" />
                          </a>
                        ) : (
                          <span className="text-gray-400">No screenshot</span>
                        )}
                      </td>
                      <td className="p-2">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellersHubTab; 
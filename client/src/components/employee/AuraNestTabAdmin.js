import React, { useState } from 'react';
import OrdersManagement from '../OrdersManagement';

// Placeholder for dashboard analytics (to be expanded)
const AuraNestDashboardAdmin = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Aura Nest Admin Dashboard</h2>
    {/* TODO: Add stats, graphs, and analytics here */}
    <div className="bg-white rounded-lg shadow p-6">Coming soon: Order stats, delivery rates, return rates, and more!</div>
  </div>
);

const AuraNestTabAdmin = () => {
  const [activeTab, setActiveTab] = useState('orders');
  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'orders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-green-600'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
      </div>
      {activeTab === 'orders' && (
        <OrdersManagement isAdmin={true} auraNestAdmin />
      )}
      {activeTab === 'dashboard' && (
        <AuraNestDashboardAdmin />
      )}
    </div>
  );
};

export default AuraNestTabAdmin; 
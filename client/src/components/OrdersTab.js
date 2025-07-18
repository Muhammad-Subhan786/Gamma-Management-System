import React, { useState } from 'react';
import OrdersManagement from './OrdersManagement';
import CreateOrder from './CreateOrder';

const OrdersTab = ({ isAdmin, employee, auraNestOnly, auraNestAdmin }) => {
  const [activeTab, setActiveTab] = useState('manage');

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b pb-2">
        <button
          className={`px-4 py-2 font-semibold rounded-t ${activeTab === 'create' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('create')}
        >
          Create Order
        </button>
        <button
          className={`px-4 py-2 font-semibold rounded-t ${activeTab === 'manage' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('manage')}
        >
          Orders Management
        </button>
      </div>
      {activeTab === 'create' && (
        <CreateOrder isAdmin={isAdmin} employee={employee} />
      )}
      {activeTab === 'manage' && (
        <OrdersManagement isAdmin={isAdmin} employee={employee} auraNestOnly={auraNestOnly} auraNestAdmin={auraNestAdmin} />
      )}
    </div>
  );
};

export default OrdersTab; 
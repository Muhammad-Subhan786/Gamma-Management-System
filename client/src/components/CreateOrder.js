import React, { useState } from 'react';
import { ordersAPI, productsAPI } from '../services/api';

const CreateOrder = ({ isAdmin, employee }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    secondaryPhone: '',
    customerEmail: '',
    customerAddress: '',
    city: '',
    products: [{ name: '', description: '', quantity: 1, price: 0, image: '', productId: null }],
    advanceAmount: 0,
    priority: 'medium',
    notes: '',
    specialInstructions: '',
    assignedEmployee: isAdmin ? '' : (employee?._id || '')
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    productsAPI.getAll().then(res => {
      const data = res.data;
      setProducts(Array.isArray(data) ? data : []);
    }).catch(() => setProducts([]));
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        ...formData,
        products: formData.products.filter(p => p.name && p.price > 0),
        assignedEmployee: isAdmin ? formData.assignedEmployee : (employee?._id || undefined)
      };
      await ordersAPI.create(orderData);
      setFormData({
        customerName: '',
        customerPhone: '',
        secondaryPhone: '',
        customerEmail: '',
        customerAddress: '',
        city: '',
        products: [{ name: '', description: '', quantity: 1, price: 0, image: '', productId: null }],
        advanceAmount: 0,
        priority: 'medium',
        notes: '',
        specialInstructions: '',
        assignedEmployee: isAdmin ? '' : (employee?._id || '')
      });
      alert('Order created successfully!');
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
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', description: '', quantity: 1, price: 0, image: '', productId: null }]
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
      products: prev.products.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  return (
    <form onSubmit={handleCreateOrder} className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold mb-4">Create New Order</h2>
      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" name="customerName" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="input-field" placeholder="Customer Name *" required />
        <input type="text" name="customerPhone" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="input-field" placeholder="Customer Phone *" required />
        <input type="text" name="secondaryPhone" value={formData.secondaryPhone} onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value })} className="input-field" placeholder="Secondary Phone" />
        <input type="email" name="customerEmail" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} className="input-field" placeholder="Customer Email" />
        <input type="text" name="city" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="input-field" placeholder="City *" required />
        <textarea name="customerAddress" value={formData.customerAddress} onChange={e => setFormData({ ...formData, customerAddress: e.target.value })} className="input-field md:col-span-2" placeholder="Customer Address *" rows={2} required />
      </div>
      {/* Products */}
      <div>
        <h3 className="font-semibold mb-2">Products</h3>
        {formData.products.map((product, idx) => (
          <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-center">
            <input type="text" placeholder="Product Name *" value={product.name} onChange={e => updateProduct(idx, 'name', e.target.value)} className="input-field flex-1" required />
            <input type="number" placeholder="Quantity *" value={product.quantity} min={1} onChange={e => updateProduct(idx, 'quantity', parseInt(e.target.value) || 1)} className="input-field w-24" required />
            <input type="number" placeholder="Price *" value={product.price} min={0} step={0.01} onChange={e => updateProduct(idx, 'price', parseFloat(e.target.value) || 0)} className="input-field w-32" required />
            <input type="text" placeholder="Description" value={product.description} onChange={e => updateProduct(idx, 'description', e.target.value)} className="input-field flex-1" />
            {formData.products.length > 1 && (
              <button type="button" onClick={() => removeProduct(idx)} className="text-red-500 hover:underline ml-2">Remove</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addProduct} className="btn-secondary mt-2">Add Another Product</button>
      </div>
      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="number" name="advanceAmount" value={formData.advanceAmount} onChange={e => setFormData({ ...formData, advanceAmount: parseFloat(e.target.value) || 0 })} className="input-field" placeholder="Advance Amount" min={0} step={0.01} />
        <select name="priority" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="input-field">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <textarea name="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input-field md:col-span-2" placeholder="Notes" rows={2} />
        <textarea name="specialInstructions" value={formData.specialInstructions} onChange={e => setFormData({ ...formData, specialInstructions: e.target.value })} className="input-field md:col-span-2" placeholder="Special Instructions" rows={2} />
      </div>
      {/* Assign to Employee (admin only) */}
      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Employee</label>
          <input type="text" name="assignedEmployee" value={formData.assignedEmployee} onChange={e => setFormData({ ...formData, assignedEmployee: e.target.value })} className="input-field w-full" placeholder="Employee ID or Name" required />
        </div>
      )}
      <button type="submit" className="btn-primary w-full mt-4" disabled={loading}>
        {loading ? 'Creating...' : 'Create Order'}
      </button>
    </form>
  );
};

export default CreateOrder; 
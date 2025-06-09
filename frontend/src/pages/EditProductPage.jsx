import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    image: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await authFetch(`/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();

        setProduct({
          name: data.name || '',
          description: data.description || '',
          price: data.price || '',
          stock_quantity: data.stock_quantity || '',
          image: data.image || ''
        });
      } catch (err) {
        setError(err.message);
      }
    }

    fetchProduct();
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    const trimmedName = form.name?.trim();
  
    if (
      !trimmedName ||
      isNaN(form.price) || form.price <= 0 ||
      isNaN(form.stock_quantity) || form.stock_quantity < 0
    ) {
      setError('Please provide a valid name, price > 0, and stock ≥ 0');
      return;
    }
  
    try {
      const res = await authFetch('/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: trimmedName }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Product creation failed');
  
      setSuccess('Product added successfully');
      setForm({ name: '', price: '', description: '', stock_quantity: '' });
  
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };
  

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          value={product.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-2 border rounded"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          value={product.price}
          onChange={handleChange}
          placeholder="Price"
          className="w-full p-2 border rounded"
        />
        <input
          name="stock_quantity"
          type="number"
          min="0"
          value={product.stock_quantity}
          onChange={handleChange}
          placeholder="Stock Quantity"
          className="w-full p-2 border rounded"
        />
        <input
          name="image"
          value={product.image}
          onChange={handleChange}
          placeholder="Image URL"
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save
        </button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authFetch } from '../services/api';

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    stock_quantity: ''
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) setImage(e.target.files[0]);
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
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>

      <Link
        to="/admin"
        className="inline-block mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        ← Back to Dashboard
      </Link>

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product name"
          required
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          required
          className="w-full p-2 mb-2 border rounded"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          required
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="number"
          name="stock_quantity"
          min="0.01"
          value={form.stock_quantity}
          onChange={handleChange}
          placeholder="Stock quantity"
          required
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          className="w-full p-2 mb-4"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

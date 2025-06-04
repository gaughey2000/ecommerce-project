import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../services/api';

export default function CheckoutPage() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', email: '', address: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.email || !form.address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const res = await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Order submission failed');
      }

      setSuccess('Order placed successfully!');
      setForm({ name: '', email: '', address: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return <p className="mt-10 text-center">Please login to checkout.</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-4 border rounded">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Full Name"
        className="w-full p-2 mb-3 border rounded"
        required
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full p-2 mb-3 border rounded"
        required
      />
      <textarea
        name="address"
        value={form.address}
        onChange={handleChange}
        placeholder="Shipping Address"
        className="w-full p-2 mb-3 border rounded"
        required
      />

      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        Place Order
      </button>
    </form>
  );
}

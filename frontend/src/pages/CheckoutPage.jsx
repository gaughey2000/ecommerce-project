import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../services/api';

export default function CheckoutPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    address: '',
  });

  const [payment, setPayment] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePaymentChange = e => setPayment({ ...payment, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.email || !form.address || !payment.cardNumber || !payment.expiry || !payment.cvv) {
      setError('Please fill in all required fields');
      return;
    }

    setSuccess('Processing...');
    try {
      const res = await authFetch('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          shipping_info: form,
          payment_info: payment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      navigate(`/order-confirmation/${data.orderId}`);
    } catch (err) {
      setSuccess('');
      setError(err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto my-10 px-4 py-6 bg-white rounded shadow space-y-4"
    >
      <h1 className="text-xl font-bold text-center">Checkout</h1>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 text-sm text-center">{success}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Card Number</label>
        <input
          name="cardNumber"
          type="text"
          value={payment.cardNumber}
          onChange={handlePaymentChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700">Expiry (MM/YY)</label>
          <input
            name="expiry"
            type="text"
            value={payment.expiry}
            onChange={handlePaymentChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700">CVV</label>
          <input
            name="cvv"
            type="text"
            value={payment.cvv}
            onChange={handlePaymentChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
      >
        Place Order
      </button>
    </form>
  );
}
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../services/api';

export default function CheckoutPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: localStorage.getItem('email') || '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payment, setPayment] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.email || !form.address || !payment.cardNumber || !payment.expiry || !payment.cvv) {
      setError('Please fill in all required fields');
      return;
    }
    if (payment.cvv.length !== 3) {
      setError('CVV must be 3 digits');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) {
      setError('Expiry date must be in MM/YY format');
      return;
    }
    if (!/^\d{16}$/.test(payment.cardNumber)) {
      setError('Card number must be 16 digits');
      return;
    }
    setSuccess('Processing your order...');
    localStorage.setItem('email', form.email); // Save email for future use
    setTimeout(() => setSuccess(''), 3000);


    try {
      const res = await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          shipping_info: form,
          payment_info: payment
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order submission failed');

      // Redirect to confirmation page
      navigate(`/order-confirmation/${data.orderId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePaymentChange = e => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
  }

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
      <input
        name="cardNumber"
        type="text"
        value={payment.cardNumber}
        onChange={handlePaymentChange}
        placeholder="Card Number"
        className="w-full p-2 border rounded mb-3"
        required
      />
      <input
        name="expiry"
        type="text"
        value={payment.expiry}
        onChange={handlePaymentChange}
        placeholder="Expiry Date (MM/YY)"
        className="w-full p-2 border rounded mb-3"
        required
      />
      <input
        name="cvv"
        type="text"
        value={payment.cvv}
        onChange={handlePaymentChange}
        placeholder="CVV"
        className="w-full p-2 border rounded mb-3"
        required
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Place Order
      </button>
    </form>
  );
}

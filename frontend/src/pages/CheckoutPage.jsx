import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../services/api';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';

export default function CheckoutPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
  });

  const [payment, setPayment] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setForm(prev => ({ ...prev, email: user?.email || '' }));
    setTimeout(() => setLoading(false), 300); // Simulate load delay
  }, [user]);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePaymentChange = e =>
    setPayment(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.address ||
      !payment.cardNumber ||
      !payment.expiry ||
      !payment.cvv
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.loading('Processing order...');
    try {
      const data = await authFetch('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          shipping_info: form,
          payment_info: payment,
        }),
      });

      toast.success('✅ Order placed!');
      navigate(`/order-confirmation/${data.orderId}`);
    } catch (err) {
      toast.error(err.message || 'Checkout failed');
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <h1 className="text-xl font-bold text-center mb-4">Checkout</h1>

      {loading ? (
        <SkeletonCard />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow space-y-4"
        >
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
      )}
    </div>
  );
}
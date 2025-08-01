import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../services/api';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';

export default function CheckoutPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', address: '' });
  const [payment, setPayment] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(prev => ({ ...prev, email: user?.email || '' }));
    setTimeout(() => setLoading(false), 300);
  }, [user]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePaymentChange = e => setPayment(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.name || !form.email || !form.address ||
        !payment.cardNumber || !payment.expiry || !payment.cvv) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Processing order...');

    try {
      const data = await authFetch('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          shipping_info: form,
          payment_info: payment,
        }),
      });

      if (!data?.orderId) throw new Error('Invalid response from server');

      toast.success('✅ Order placed!', { id: toastId });
      navigate(`/order-confirmation/${data.orderId}`);
    } catch (err) {
      toast.error(err.message || 'Checkout failed', { id: toastId });
    } finally {
      setSubmitting(false);
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
            <label className="block text-sm font-medium">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Shipping Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block text-sm font-medium">Card Number</label>
            <input name="cardNumber" value={payment.cardNumber} onChange={handlePaymentChange} className="w-full border p-2 rounded" required />
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium">Expiry (MM/YY)</label>
              <input name="expiry" value={payment.expiry} onChange={handlePaymentChange} className="w-full border p-2 rounded" required />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">CVV</label>
              <input name="cvv" value={payment.cvv} onChange={handlePaymentChange} className="w-full border p-2 rounded" required />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded disabled:opacity-50"
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      )}
    </div>
  );
}
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import SkeletonCard from '../components/SkeletonCard';
import { toast } from 'sonner';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await authFetch(`/orders/${orderId}`);
        setOrder(data);
      } catch (err) {
        toast.error(err.message || 'Unable to load order.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Order Confirmation</h1>

      {loading && <SkeletonCard />}

      {!loading && order && (
        <div className="bg-white p-6 rounded shadow space-y-4">
          <p><strong>Order ID:</strong> {order.order_id}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span className={order.status === 'pending' ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'}>
              {order.status}
            </span>
          </p>
          <p><strong>Total:</strong> £{Number(order.total_amount).toFixed(2)}</p>
          <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>

          <h2 className="text-xl font-semibold mt-6">Shipping Info</h2>
          <p>{order.shipping_name}</p>
          <p>{order.shipping_email}</p>
          <p>{order.shipping_address}</p>
        </div>
      )}
    </div>
  );
}
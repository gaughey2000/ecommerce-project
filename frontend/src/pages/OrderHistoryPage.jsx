import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import SkeletonCard from '../components/SkeletonCard';
import { toast } from 'sonner';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await authFetch('/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        toast.error(err.message || 'Unable to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Order History</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.length > 0 ? (
            orders.map(order => (
              <li key={order.order_id} className="bg-white p-4 rounded shadow">
                <p><strong>ID:</strong> {order.order_id}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={order.status === 'pending' ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'}>
                    {order.status}
                  </span>
                </p>
                <p><strong>Total:</strong> £{Number(order.total_amount).toFixed(2)}</p>
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              </li>
            ))
          ) : (
            <li className="text-center text-gray-500">No past orders found.</li>
          )}
        </ul>
      )}
    </div>
  );
}
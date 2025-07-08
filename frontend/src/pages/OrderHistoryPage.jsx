import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/orders')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
      })
      .then(setOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Order History</h1>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {loading ? (
        <p className="text-center text-gray-500">Loading your orders...</p>
      ) : (
        <ul className="space-y-4">
          {orders.length > 0 ? (
            orders.map(order => (
              <li key={order.order_id} className="bg-white p-4 rounded shadow">
                <p><strong>ID:</strong> {order.order_id}</p>
                <p><strong>Status:</strong> <span className={order.status === 'pending' ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'}>{order.status}</span></p>
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
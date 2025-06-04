import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../services/api';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await authFetch('/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchOrders();
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (orders.length === 0) return <p>No past orders found.</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded">
      <h1 className="text-2xl font-bold mb-4">Your Order History</h1>
      <ul>
        {orders.map(order => (
          <li key={order.order_id} className="mb-3">
            <Link
              to={`/order-confirmation/${order.order_id}`}
              className="text-blue-600 hover:underline"
            >
              Order #{order.order_id} - {order.status} - £{order.total_amount.toFixed(2)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

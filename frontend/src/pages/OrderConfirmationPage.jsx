import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch(`/orders/${orderId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch order');
        return res.json();
      })
      .then(setOrder)
      .catch(err => setError(err.message));
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Order Confirmation</h1>

      {error && <p className="text-center text-red-600">{error}</p>}

      {order ? (
        <div className="bg-white p-6 rounded shadow space-y-4">
          <p><strong>Order ID:</strong> {order.order_id}</p>
          <p><strong>Status:</strong> <span className={order.status === 'pending' ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'}>{order.status}</span></p>
          <p><strong>Total:</strong> £{Number(order.total_amount).toFixed(2)}</p>
          <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>

          <h2 className="text-xl font-semibold mt-6">Shipping Info</h2>
          <p>{order.shipping_name}</p>
          <p>{order.shipping_email}</p>
          <p>{order.shipping_address}</p>
        </div>
      ) : !error ? (
        <p className="text-center text-gray-600">Loading order...</p>
      ) : null}
    </div>
  );
}
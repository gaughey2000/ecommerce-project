import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authFetch } from '../services/api';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const resOrder = await authFetch(`/orders/${orderId}`);
        if (!resOrder.ok) throw new Error('Failed to fetch order');
        const orderData = await resOrder.json();
        setOrder(orderData);

        const resItems = await authFetch(`/orders/${orderId}/items`);
        if (!resItems.ok) throw new Error('Failed to fetch order items');
        const itemsData = await resItems.json();
        setItems(itemsData);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchOrder();
  }, [orderId]);

  const formatPrice = (value) => `£${Number(value || 0).toFixed(2)}`;

  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p>Loading order details...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded">
      <h1 className="text-2xl font-bold mb-4">Thank you for your order!</h1>
      <p className="mb-4">Order ID: {order.order_id}</p>
      <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
      <ul>
        {items.map(item => (
          <li key={item.order_item_id} className="mb-2">
            {item.quantity} × Product #{item.product_id} @ {formatPrice(item.unit_price)}
          </li>
        ))}
      </ul>
      <p>Total: {formatPrice(order.total_amount)}</p>
      <Link to="/" className="inline-block mt-6 text-blue-600 hover:underline">
        Continue Shopping
      </Link>
      <br />
      <Link to="/orders" className="inline-block mt-2 text-blue-600 hover:underline">
        View Order History
      </Link>
    </div>
  );
}


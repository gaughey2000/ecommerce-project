// frontend/src/pages/OrderSuccess.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [state, setState] = useState({ loading: true, error: '', order: null });

  useEffect(() => {
    async function run() {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Missing auth token. Please log in again.');
        const res = await fetch(`/api/orders/by-session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const order = await res.json();
        setState({ loading: false, error: '', order });
      } catch (err) {
        setState({ loading: false, error: err.message, order: null });
      }
    }
    if (sessionId) run();
  }, [sessionId]);

  if (!sessionId) return <div>No session id in URL.</div>;
  if (state.loading) return <div>Confirming payment…</div>;
  if (state.error) return <div>Could not load order: {state.error}</div>;

  const { order_id, total_amount, status } = state.order || {};
  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>
      <h1>Thanks! 🎉</h1>
      <p>Your payment was processed and your order is confirmed.</p>
      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
        <div><strong>Order ID:</strong> {order_id}</div>
        <div><strong>Status:</strong> {status}</div>
        <div><strong>Total:</strong> £{Number(total_amount).toFixed(2)}</div>
      </div>
      <p style={{ marginTop: '1rem' }}>
        <Link to="/orders">View all orders</Link>
      </p>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch('/cart')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch cart');
        return res.json();
      })
      .then(setCart)
      .catch(err => setError(err.message));
  }, []);

  const handleUpdate = async (productId, quantity) => {
    try {
      const res = await authFetch('/cart', {
        method: 'PUT',
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) throw new Error('Failed to update cart');
      const updated = await res.json();
      setCart(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async productId => {
    try {
      const res = await authFetch(`/cart/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove item');
      setCart(cart.filter(item => item.product_id !== productId));
    } catch (err) {
      setError(err.message);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Your Cart</h1>

      {error && <p className="text-center text-red-600 mb-4">{error}</p>}

      {cart.length > 0 ? (
        <ul className="space-y-6">
          {cart.map(item => (
            <li key={item.product_id} className="bg-white rounded shadow p-4 space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">{item.product_name}</h2>
                  <p className="text-gray-600">£{Number(item.unit_price).toFixed(2)} each</p>
                </div>
                <div className="mt-3 sm:mt-0 flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => handleUpdate(item.product_id, Number(e.target.value))}
                    className="w-16 border rounded p-1"
                  />
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">Your cart is empty.</p>
      )}

      {cart.length > 0 && (
        <div className="mt-6 text-right">
          <p className="text-xl font-semibold">Total: £{total.toFixed(2)}</p>
          <a
            href="/checkout"
            className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
          >
            Proceed to Checkout
          </a>
        </div>
      )}
    </div>
  );
}
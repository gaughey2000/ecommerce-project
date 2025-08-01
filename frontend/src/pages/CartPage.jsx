import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchCart = async () => {
    try {
      const data = await authFetch('/cart');
      setCart(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdate = async (cartItemId, quantity) => {
    if (quantity < 1) return;
    setUpdating(true);
    try {
      await authFetch(`/cart/${cartItemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      await fetchCart();
      toast.success('Item updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (cartItemId) => {
    setUpdating(true);
    try {
      await authFetch(`/cart/${cartItemId}`, { method: 'DELETE' });
      setCart(prev => prev.filter(item => item.cart_item_id !== cartItemId));
      toast.success('Item removed from cart');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Your Cart</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : cart.length > 0 ? (
        <ul className="space-y-6">
          {[...cart].sort((a, b) => a.name.localeCompare(b.name)).map(item => (
            <li key={item.cart_item_id} className="bg-white rounded shadow p-4 space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="text-gray-600">£{Number(item.price).toFixed(2)} each</p>
                  <p className="text-gray-700 text-sm">
                    Subtotal: £{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 flex gap-2 items-center">
                  <button
                    aria-label="Decrease quantity"
                    disabled={updating || item.quantity <= 1}
                    onClick={() => handleUpdate(item.cart_item_id, item.quantity - 1)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    disabled={updating}
                    onClick={() => handleUpdate(item.cart_item_id, item.quantity + 1)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    +
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => handleRemove(item.cart_item_id)}
                    className="text-red-600 hover:underline text-sm disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">
          Your cart is empty.{' '}
          <a href="/products" className="text-blue-600 underline">
            Browse products
          </a>.
        </p>
      )}

      {!loading && cart.length > 0 && (
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
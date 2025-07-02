import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function CartPage() {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      authFetch('/cart')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch cart');
          return res.json();
        })
        .then(data => {
          setCart(data);
          setError('');
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) return;
    authFetch(`/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update quantity');
        return res.json();
      })
      .then(updatedItem => {
        setCart(prev =>
          prev.map(item =>
            item.cart_item_id === itemId
              ? { ...item, quantity: updatedItem.quantity }
              : item
          )
        );
      })
      .catch(err => setError(err.message));
  };

  const removeItem = (itemId) => {
    if (!window.confirm('Remove this item from cart?')) return;
    authFetch(`/cart/${itemId}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to remove item');
        setCart(prev => prev.filter(item => item.cart_item_id !== itemId));
      })
      .catch(err => setError(err.message));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  if (!user) return <p className="mt-10 text-center text-lg">Please login to view your cart.</p>;
  if (loading) return <p className="mt-10 text-center text-lg">Loading cart...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {cart.length === 0 ? (
        <p>Your cart is empty. <Link to="/products" className="text-blue-600 underline">Browse products</Link>.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map(item => (
              <li key={item.cart_item_id} className="flex gap-4 items-center border-b pb-2">
                <img
                  src={`http://localhost:3000${item.image || '/placeholder.jpg'}`}
                  alt={item.name}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p>
                    £{item.price} × {item.quantity} = <strong>£{(item.price * item.quantity).toFixed(2)}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} className="px-2 py-1 bg-gray-200 rounded">
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} className="px-2 py-1 bg-gray-200 rounded">
                    +
                  </button>
                  <button onClick={() => removeItem(item.cart_item_id)} className="px-2 py-1 bg-red-500 text-white rounded ml-2">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xl font-bold mt-4">Total: £{total}</p>
          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}
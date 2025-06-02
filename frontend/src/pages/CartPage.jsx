import { useEffect, useState, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function CartPage() {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    

    useEffect(() => {
        if (user) {
          authFetch('http://localhost:3000/api/cart')
            .then(res => {
              if (!res.ok) throw new Error('Failed to fetch cart');
              return res.json();
            })
            .then(data => {
              if (!Array.isArray(data)) throw new Error('Cart is not an array');
              setCart(data);
              setError('');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
        }
      }, [user]);
      

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) return;
    authFetch(`http://localhost:3000/api/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    })
      .then(res => res.json())
      .then(data => setCart(prev => prev.map(i => i.cart_item_id === itemId ? { ...i, quantity: data.quantity } : i)))
      .catch(err => setError('Failed to update quantity'));
  };

  const removeItem = (itemId) => {
    authFetch(`http://localhost:3000/api/cart/${itemId}`, {
      method: 'DELETE'
    })
      .then(() => setCart(prev => prev.filter(i => i.cart_item_id !== itemId)))
      .catch(err => setError('Failed to remove item'));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  if (!user) return <p className="mt-10 text-center text-lg">Please login to view your cart.</p>;
  if (loading) return <p className="mt-10 text-center text-lg">Loading cart...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <ul className="space-y-4">
            {cart.map(item => (
              <li key={item.cart_item_id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p>£{item.price} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} className="px-2 py-1 bg-gray-200">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} className="px-2 py-1 bg-gray-200">+</button>
                  <button onClick={() => removeItem(item.cart_item_id)} className="px-2 py-1 bg-red-500 text-white ml-2">Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xl font-bold mt-4">Total: £{total}</p>
        </div>
      )}
    </div>
  );
}

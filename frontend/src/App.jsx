import { useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import './App.css';

// Product component
const Product = ({ product, onAddToCart }) => {
  console.log('Rendering Product:', product.name);
  return (
    <div className="border p-4 rounded shadow">
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-gray-600">{product.description}</p>
      <p className="text-green-600 font-bold">${product.price}</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
        onClick={() => onAddToCart(product)}
      >
        Add to Cart
      </button>
    </div>
  );
};

// Main App component
function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  console.log('App component mounted');

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ userId: decoded.userId, email: localStorage.getItem('email') });
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('email');
      }
    }
  }, []);

  // Fetch products
  useEffect(() => {
    console.log('Fetching products...');
    fetch('http://localhost:3000/api/products')
      .then(res => {
        console.log('Fetch response:', res.status, res.ok);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => {
        console.log('Products data:', data);
        setProducts(data);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
      });
  }, []);

  // Handle register/login
  const handleAuth = (endpoint) => {
    console.log(`${endpoint} request:`, { email });
    fetch(`http://localhost:3000/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error); });
        }
        return res.json();
      })
      .then(data => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', data.email);
        setUser({ userId: data.userId, email: data.email });
        setEmail('');
        setPassword('');
        setError(null);
        console.log(`${endpoint} successful:`, data.userId);
      })
      .catch(err => {
        console.error(`${endpoint} error:`, err);
        setError(err.message);
      });
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
    setCart([]);
    setError(null);
    console.log('Logged out');
  };

  // Add to cart
  const addToCart = (product) => {
    if (!user) {
      setError('Please log in to add items to cart');
      return;
    }
    console.log('Attempting to add to cart:', product.name, { userId: user.userId, productId: product.product_id });
    const existingItem = cart.find(item => item.product_id === product.product_id);
    if (existingItem) {
      console.log('Item exists, updating quantity:', existingItem);
      updateCartQuantity(existingItem.cart_item_id, existingItem.quantity + 1);
    } else {
      console.log('Adding new item to cart');
      fetch('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productId: product.product_id, quantity: 1 })
      })
        .then(res => {
          console.log('Cart response:', res.status, res.ok);
          if (!res.ok) {
            return res.json().then(err => { throw new Error(err.error); });
          }
          return res.json();
        })
        .then(data => {
          console.log('Cart data:', data);
          setCart([...cart, {
            cart_item_id: data.cart_item_id,
            product_id: data.product_id,
            name: product.name,
            price: product.price,
            quantity: data.quantity
          }]);
          setError(null);
        })
        .catch(err => {
          console.error('Cart error:', err);
          setError(err.message);
        });
    }
  };

  // Update cart quantity
  const updateCartQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    console.log('Updating quantity:', { cartItemId, newQuantity });
    fetch(`http://localhost:3000/api/cart/${cartItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ quantity: newQuantity })
    })
      .then(res => {
        console.log('Update response:', res.status, res.ok);
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error); });
        }
        return res.json();
      })
      .then(data => {
        console.log('Update data:', data);
        setCart(cart.map(item =>
          item.cart_item_id === cartItemId ? { ...item, quantity: data.quantity } : item
        ));
        setError(null);
      })
      .catch(err => {
        console.error('Update error:', err);
        setError(err.message);
      });
  };

  // Remove from cart
  const removeFromCart = (cartItemId) => {
    console.log('Removing from cart:', cartItemId);
    fetch(`http://localhost:3000/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log('Remove response:', res.status, res.ok);
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error); });
        }
        setCart(cart.filter(item => item.cart_item_id !== cartItemId));
        setError(null);
      })
      .catch(err => {
        console.error('Remove error:', err);
        setError(err.message);
      });
  };

  // Clear cart
  const clearCart = () => {
    console.log('Clearing cart for user:', user.userId);
    fetch(`http://localhost:3000/api/cart/user/${user.userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log('Clear cart response:', res.status, res.ok);
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error); });
        }
        setCart([]);
        setError(null);
      })
      .catch(err => {
        console.error('Clear cart error:', err);
        setError(err.message);
      });
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

  // Place order
  const placeOrder = () => {
    console.log('Placing order for user:', user.userId);
    fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({})
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error); });
        }
        return res.json();
      })
      .then(data => {
        alert(`Order created! Order ID: ${data.orderId}`);
        setCart([]);
        setError(null);
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">E-commerce Store</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {!user ? (
        <div className="mb-6">
          <h2 className="text-2xl mb-2">{isRegistering ? 'Register' : 'Login'}</h2>
          <div className="flex flex-col space-y-2 max-w-md">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => handleAuth(isRegistering ? 'register' : 'login')}
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
            <button
              className="text-blue-500 hover:underline"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Switch to Login' : 'Switch to Register'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center space-x-4">
          <p>Welcome, {user.email}</p>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
      <h2 className="text-2xl mb-2">Products</h2>
      {products.length === 0 && !error ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map(product => (
            <Product key={product.product_id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      )}
      {user && (
        <>
          <h2 className="text-2xl mt-6 mb-2">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-600">Cart is empty</p>
          ) : (
            <div>
              <ul className="mb-4">
                {cart.map((item, index) => (
                  <li key={index} className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{item.name} (${item.price} each)</span>
                      <button
                        className="bg-gray-300 text-black px-2 py-1 rounded hover:bg-gray-400"
                        onClick={() => updateCartQuantity(item.cart_item_id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>Qty: {item.quantity}</span>
                      <button
                        className="bg-gray-300 text-black px-2 py-1 rounded hover:bg-gray-400"
                        onClick={() => updateCartQuantity(item.cart_item_id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      onClick={() => removeFromCart(item.cart_item_id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-lg font-semibold">Total: ${cartTotal}</p>
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mt-4 mr-2"
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>
          )}
          {cart.length > 0 && (
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
              onClick={placeOrder}
            >
              Place Order
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default App;
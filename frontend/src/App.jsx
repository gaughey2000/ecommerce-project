import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import './App.css';

// Product Component
const Product = ({ product, onAddToCart }) => {
  if (!product || !product.name || !product.price) {
    console.warn('Invalid product data:', product);
    return <p className="text-gray-500">Product unavailable</p>;
  }

  return (
    <div className="border p-4 rounded shadow">
      <img
        src={product.image ? `http://localhost:3000${product.image}` : 'http://localhost:3000/uploads/placeholder.jpg'}
        alt={product.name}
        className="w-full h-48 object-cover mb-2"
      />
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-gray-600">{product.description || 'No description'}</p>
      <p className="text-green-600 font-bold">£{Number(product.price).toFixed(2)}</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
        onClick={() => onAddToCart(product)}
      >
        Add to Cart
      </button>
    </div>
  );
};

// Main App Component
function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    stock_quantity: '',
    image: ''
  });

  // Check for token and admin status
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ userId: decoded.userId, email: localStorage.getItem('email') });
        // Fetch admin status
        fetch('http://localhost:3000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch user data');
            return res.json();
          })
          .then(data => setIsAdmin(data.is_admin || false))
          .catch(err => console.error('Fetch admin status error:', err));
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('email');
      }
    }
  }, []);

  useEffect(() => {
    const url = searchQuery
      ? `http://localhost:3000/api/products?query=${encodeURIComponent(searchQuery)}`
      : 'http://localhost:3000/api/products';
    fetch(url)
      .then(res => {
        console.log('Fetch products status:', res.status, res.statusText);
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Failed to fetch products: ${res.status} ${text}`);
          });
        }
        return res.json();
      })
      .then(data => {
        console.log('Fetch products data:', data);
        if (!Array.isArray(data)) throw new Error('Invalid product data format');
        setProducts(data);
      })
      .catch(err => {
        console.error('Fetch products error:', err);
        setError(err.message);
      });
  }, [searchQuery]);

  // Fetch orders
  useEffect(() => {
    if (user) {
      fetch(`http://localhost:3000/api/orders/user/${user.userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch orders');
          return res.json();
        })
        .then(data => setOrders(data))
        .catch(err => setError(err.message));
    }
  }, [user]);

  // Fetch users (admin only)
  useEffect(() => {
    if (isAdmin) {
      fetch('http://localhost:3000/api/auth/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch users');
          return res.json();
        })
        .then(data => setUsers(data))
        .catch(err => setError(err.message));
    }
  }, [isAdmin]);

  // Validate email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Handle register/login
  const handleAuth = (endpoint) => {
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }

    if (endpoint === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    fetch(`http://localhost:3000/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Request failed') });
        }
        return res.json();
      })
      .then(data => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', data.email);
        setUser({ userId: data.userId, email: data.email });
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSuccess(endpoint === 'register' ? 'Registration successful! Logged in.' : 'Login successful!');
        // Fetch admin status after login
        fetch('http://localhost:3000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch user data');
            return res.json();
          })
          .then(data => setIsAdmin(data.is_admin || false))
          .catch(err => console.error('Fetch admin status error:', err));
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
    setIsAdmin(false);
    setCart([]);
    setOrders([]);
    setUsers([]);
    setError(null);
    setSuccess(null);
    setShowCheckoutForm(false);
  };

  // Add to cart
  const addToCart = (product) => {
    if (!user) {
      setError('Please log in to add items to cart');
      return;
    }
    const existingItem = cart.find(item => item.product_id === product.product_id);
    if (existingItem) {
      updateCartQuantity(existingItem.cart_item_id, existingItem.quantity + 1);
    } else {
      fetch('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productId: product.product_id, quantity: 1 })
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to add to cart');
          return res.json();
        })
        .then(data => {
          setCart([...cart, {
            cart_item_id: data.cart_item_id,
            product_id: data.product_id,
            name: product.name,
            price: product.price,
            quantity: data.quantity
          }]);
          setError(null);
        })
        .catch(err => setError(err.message));
    }
  };

  // Update cart quantity
  const updateCartQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    fetch(`http://localhost:3000/api/cart/${cartItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ quantity: newQuantity })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update cart');
        return res.json();
      })
      .then(data => {
        setCart(cart.map(item =>
          item.cart_item_id === cartItemId ? { ...item, quantity: data.quantity } : item
        ));
        setError(null);
      })
      .catch(err => setError(err.message));
  };

  // Remove from cart
  const removeFromCart = (cartItemId) => {
    fetch(`http://localhost:3000/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to remove from cart');
        setCart(cart.filter(item => item.cart_item_id !== cartItemId));
        setError(null);
      })
      .catch(err => setError(err.message));
  };

  // Clear cart
  const clearCart = () => {
    fetch(`http://localhost:3000/api/cart/user/${user.userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to clear cart');
        setCart([]);
        setError(null);
      })
      .catch(err => setError(err.message));
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

  // Handle shipping info input
  const handleShippingInput = (e) => {
    const { name, value } = e.target;
    setShippingInfo({ ...shippingInfo, [name]: value });
  };

  // Handle payment info input
  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    setPaymentInfo({ ...paymentInfo, [name]: value });
  };

  // Initiate checkout
  const initiateCheckout = () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }
    setShowCheckoutForm(true);
  };

  // Place order with payment
  const placeOrder = () => {
    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode || !shippingInfo.country) {
      setError('Please fill in all shipping information');
      return;
    }
    if (!paymentInfo.cardNumber || !paymentInfo.expiry || !paymentInfo.cvv) {
      setError('Please fill in all payment information');
      return;
    }
    if (!/^\d{16}$/.test(paymentInfo.cardNumber.replace(/\s/g, ''))) {
      setError('Card number must be 16 digits');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentInfo.expiry)) {
      setError('Expiry must be MM/YY');
      return;
    }
    if (!/^\d{3}$/.test(paymentInfo.cvv)) {
      setError('CVV must be 3 digits');
      return;
    }

    const cartItems = cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }));

    fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        cart_items: cartItems, 
        shipping_info: shippingInfo,
        payment_info: paymentInfo
      })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.details || err.error || 'Failed to place order') });
        }
        return res.json();
      })
      .then(data => {
        setSuccess(`Order placed! Order ID: ${data.orderId}, Total: £${data.total}`);
        setCart([]);
        setShippingInfo({ address: '', city: '', postalCode: '', country: '' });
        setPaymentInfo({ cardNumber: '', expiry: '', cvv: '' });
        setShowCheckoutForm(false);
        fetch(`http://localhost:3000/api/orders/user/${user.userId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
          })
          .then(data => setOrders(data))
          .catch(err => setError(err.message));
      })
      .catch(err => setError(`Checkout failed: ${err.message}`));
  };

  // Handle new product input
  const handleProductInput = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  // Add new product
  const addNewProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock_quantity) {
      setError('Name, price, and stock quantity are required');
      return;
    }
    if (newProduct.price <= 0 || newProduct.stock_quantity < 0) {
      setError('Price must be positive, stock quantity non-negative');
      return;
    }

    fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newProduct)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to add product') });
        }
        return res.json();
      })
      .then(data => {
        setProducts([...products, data]);
        setNewProduct({ name: '', price: '', description: '', stock_quantity: '', image: '' });
        setSuccess('Product added successfully');
        setError(null);
      })
      .catch(err => setError(err.message));
  };

  // Delete user
  const deleteUser = (userId) => {
    if (userId === user.userId) {
      setError('Cannot delete your own account');
      return;
    }
    fetch(`http://localhost:3000/api/auth/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to delete user') });
        }
        return res.json();
      })
      .then(() => {
        setUsers(users.filter(u => u.user_id !== userId));
        setSuccess(`User ${userId} deleted`);
        setError(null);
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">E-commerce Store</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
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
            {isRegistering && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border p-2 rounded"
              />
            )}
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => handleAuth(isRegistering ? 'register' : 'login')}
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
            <button
              className="text-blue-500 hover:underline"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccess(null);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              {isRegistering ? 'Switch to Login' : 'Switch to Register'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center space-x-4">
          <p>Welcome, {user.email} {isAdmin && '(Admin)'}</p>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
      <h2 className="text-2xl mb-2">Products</h2>
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 rounded mb-4 w-full max-w-md"
      />
      {products.length === 0 && !error ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products found</p>
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
                      <span>{item.name} (£{Number(item.price).toFixed(2)} each)</span>
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
              <p className="text-lg font-semibold">Total: £{cartTotal}</p>
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mt-4 mr-2"
                onClick={clearCart}
              >
                Clear Cart
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
                onClick={initiateCheckout}
              >
                Proceed to Checkout
              </button>
              {showCheckoutForm && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Shipping Information</h3>
                  <div className="flex flex-col space-y-2">
                    <input
                      type="text"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleShippingInput}
                      placeholder="Address"
                      className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingInput}
                      placeholder="City"
                      className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={handleShippingInput}
                      placeholder="Postal Code"
                      className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="country"
                      value={shippingInfo.country}
                      onChange={handleShippingInput}
                      placeholder="Country"
                      className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <h3 className="text-xl font-semibold mt-4 mb-2">Payment Information</h3>
                  <div className="flex flex-col space-y-2">
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentInfo.cardNumber}
                      onChange={handlePaymentInput}
                      placeholder="Card Number (16 digits)"
                      className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="expiry"
                        value={paymentInfo.expiry}
                        onChange={handlePaymentInput}
                        placeholder="MM/YY"
                        className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                        required
                      />
                      <input
                        type="text"
                        name="cvv"
                        value={paymentInfo.cvv}
                        onChange={handlePaymentInput}
                        placeholder="CVV (3 digits)"
                        className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                        required
                      />
                    </div>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-2"
                      onClick={placeOrder}
                    >
                      Complete Purchase
                    </button>
                    <button
                      className="text-blue-500 hover:underline mt-2"
                      onClick={() => setShowCheckoutForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <h2 className="text-2xl mt-6 mb-2">My Orders</h2>
          {orders.length === 0 ? (
            <p className="text-gray-600">No orders yet</p>
          ) : (
            <ul>
              {orders.map(order => (
                <li key={order.order_id}>Order #{order.order_id} - Status: {order.status || 'Pending'}</li>
              ))}
            </ul>
          )}
          {isAdmin && (
            <div className="mt-6">
              <h2 className="text-2xl mb-2">Admin Panel</h2>
              <h3 className="text-xl font-semibold mb-2">Add New Product</h3>
              <div className="flex flex-col space-y-2 max-w-md">
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleProductInput}
                  placeholder="Product Name"
                  className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  name="price"
                  value={newProduct.price}
                  onChange={handleProductInput}
                  placeholder="Price"
                  className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  name="description"
                  value={newProduct.description}
                  onChange={handleProductInput}
                  placeholder="Description"
                  className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  name="stock_quantity"
                  value={newProduct.stock_quantity}
                  onChange={handleProductInput}
                  placeholder="Stock Quantity"
                  className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  name="image"
                  value={newProduct.image}
                  onChange={handleProductInput}
                  placeholder="Image URL (optional)"
                  className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={addNewProduct}
                >
                  Add Product
                </button>
              </div>
              <h3 className="text-xl font-semibold mt-4 mb-2">Manage Users</h3>
              {users.length === 0 ? (
                <p className="text-gray-600">No users found</p>
              ) : (
                <ul className="space-y-2">
                  {users.map(u => (
                    <li key={u.user_id} className="flex justify-between items-center">
                      <span>{u.email} (ID: {u.user_id}) {u.is_admin && '(Admin)'}</span>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => deleteUser(u.user_id)}
                        disabled={u.user_id === user.userId}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
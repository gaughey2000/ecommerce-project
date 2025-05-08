import { useState, useEffect } from 'react';
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
  const userId = 1;

  console.log('App component mounted');

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

  // Add to cart
  const addToCart = (product) => {
    console.log('Adding to cart:', product.name, { userId, productId: product.product_id });
    fetch('http://localhost:3000/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId: product.product_id, quantity: 1 })
    })
      .then(res => {
        console.log('Cart response:', res.status, res.ok);
        if (!res.ok) throw new Error(`Failed to add to cart: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        console.log('Cart data:', data);
        setCart([...cart, { product_id: data.product_id, quantity: data.quantity }]);
      })
      .catch(err => {
        console.error('Cart error:', err);
        setError(`Error adding to cart: ${err.message}`);
      });
  };

  // Place order
  const placeOrder = () => {
    console.log('Placing order for user:', userId);
    fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create order');
        return res.json();
      })
      .then(data => {
        alert(`Order created! Order ID: ${data.orderId}`);
        setCart([]);
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">E-commerce Store</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
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
      <h2 className="text-2xl mt-6 mb-2">Cart</h2>
      {cart.length === 0 ? (
        <p className="text-gray-600">Cart is empty</p>
      ) : (
        <ul className="mb-4">
          {cart.map((item, index) => (
            <li key={index}>
              Product ID: {item.product_id}, Quantity: {item.quantity}
            </li>
          ))}
        </ul>
      )}
      {cart.length > 0 && (
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={placeOrder}
        >
          Place Order
        </button>
      )}
    </div>
  );
}

export default App;
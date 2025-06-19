import { useState, useEffect, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function ProductListPage() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    authFetch('/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => setProducts(data))
      .catch(err => setError(err.message));
  }, []);

  const handleAddToCart = async (productId) => {
    setError('');
    setSuccess('');

    const numericId = Number(productId);
    try {
      const res = await authFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: numericId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Add to cart failed');
      setSuccess('Added to cart!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Browse Our Products</h1>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-3 mb-6 border border-gray-300 rounded shadow-sm"
      />

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success && <p className="text-green-600 mb-4 text-center">{success}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition flex flex-col"
            >
              <img
                src={product.image ? `http://localhost:3000${product.image}` : '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-48 object-cover rounded mb-3"
              />
              <h2 className="text-xl font-semibold mb-1">{product.name}</h2>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              <p className="text-lg text-green-600 font-bold mb-2">£{Number(product.price).toFixed(2)}</p>
              {user && (
                <button
                  onClick={() => handleAddToCart(product.id)}
                  className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mt-auto"
                >
                  Add to Cart
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">No products found.</p>
        )}
      </div>
    </div>
  );
}
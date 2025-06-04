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
    try {
      const res = await authFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }) // <-- Changed here
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Add to cart failed');
      setSuccess('Added to cart!');
    } catch (err) {
      setError(err.message);
    }
  };
  

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Product Listing</h1>
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.length > 0 ? (
          filtered.map(product => {
            console.log('PRODUCT DEBUG:', product); // 🔍 Debugging product structure
            return (
              <div key={product.product_id} className="border rounded p-4 shadow">
                <img
                  src={`http://localhost:3000${product.image}`}
                  alt={product.name}
                  className="w-full h-48 object-cover mb-2"
                />
                <h2 className="text-lg font-semibold">{product.name}</h2>
                <p className="text-gray-700 text-sm">{product.description}</p>
                <p className="text-green-600 font-bold">£{Number(product.price).toFixed(2)}</p>
                {user && (
                  <button onClick={() => handleAddToCart(product.product_id)}>Add to Cart</button>

                )}
              </div>
            );
          })
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </div>
  );
}
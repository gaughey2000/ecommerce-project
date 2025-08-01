import { useEffect, useState, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';

export default function ProductListPage() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/products')
      .then(setProducts)
      .catch(err => {
        console.error('❌ Product fetch error:', err.message);
        toast.error('Failed to fetch products');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (productId) => {
    setLoadingId(productId);
    const product = products.find(p => p.id === productId);
  
    if (!product || product.stock_quantity < 1) {
      toast.error('This product is out of stock');
      setLoadingId(null);
      return;
    }
  
    try {
      await authFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
  
      toast.success('✅ Added to cart!');
      setCartItems(prev => [...prev, productId]);
    } catch (err) {
      toast.error(err.message || 'Could not add to cart');
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mt-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Browse Products</h1>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-3 mb-6 border border-gray-300 rounded shadow-sm"
      />

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length > 0 ? (
          filtered.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
            >
              <img
                src={product.image ? `http://localhost:3000${product.image}` : '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-48 object-cover rounded mb-3"
                onError={e => { e.currentTarget.src = '/placeholder.jpg'; }}
              />
              <h2 className="text-xl font-semibold mb-1">{product.name}</h2>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
              <p className="text-lg text-green-600 font-bold mb-1">£{Number(product.price).toFixed(2)}</p>
              <p className={`text-sm font-medium ${product.stock_quantity < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </p>

              {user && (
                product.stock_quantity > 0 ? (
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={loadingId === product.id}
                    className={`mt-2 ${loadingId === product.id ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 rounded transition`}
                  >
                    {loadingId === product.id ? 'Adding...' : 'Add to Cart'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="mt-2 bg-gray-400 text-white py-2 rounded cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full">No products found.</p>
        )}
      </div>
    </div>
  );
}
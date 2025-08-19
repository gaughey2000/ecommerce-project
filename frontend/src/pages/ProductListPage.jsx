import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../services/api';
import { mediaUrl } from '../lib/media';

export default function ProductListPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    authFetch('/products')
      .then((rows) => { if (isMounted) setProducts(rows || []); })
      .catch(() => { if (isMounted) setProducts([]); });
    return () => { isMounted = false; };
  }, []);

  function formatPrice(p) {
    const currency = p.currency || 'GBP';
    const amount = typeof p.unit_amount === 'number' ? p.unit_amount / 100 : p.price;
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount ?? 0);
    } catch {
      return `£${(amount ?? 0).toFixed(2)}`;
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Products</h1>
      <ul className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.id} className="group rounded-2xl border bg-white p-4 shadow-sm hover:shadow transition">
            <Link to={`/products/${p.id}`} className="block">
              <div className="aspect-square overflow-hidden rounded-xl border bg-gray-50">
                <img
                  src={mediaUrl(p.image)}
                  alt={p.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition"
                  onError={(e) => { e.currentTarget.src = mediaUrl('/uploads/placeholder.jpg'); }}
                />
              </div>
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 line-clamp-1">{p.name}</h3>
                <p className="mt-1 text-gray-700">{formatPrice(p)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
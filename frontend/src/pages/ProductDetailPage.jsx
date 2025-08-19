import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_BASE_URL, authFetch } from '../services/api';
import { mediaUrl } from '../lib/media';
import SkeletonCard from '../components/SkeletonCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Not found');
          throw new Error('Failed to load product');
        }
        const data = await res.json();
        if (!cancelled) setProduct(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const price = useMemo(() => {
    if (!product) return 0;
    return typeof product.unit_amount === 'number'
      ? product.unit_amount / 100
      : Number(product.price ?? 0);
  }, [product]);

  const formatGBP = (n) => `£${Number(n).toFixed(2)}`;

  async function addToCart() {
    if (!product) return;
    try {
      await authFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: qty }),
      }, true);
      toast.success('Added to cart');
    } catch (err) {
      console.error(err);
      toast.error('Please log in to add items to your cart');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonCard />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Product not found</h1>
        <p className="mt-2 text-gray-600">It may have been moved or archived.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const outOfStock = Number(product.stock_quantity ?? 0) <= 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm text-gray-600">
        <button
          onClick={() => navigate(-1)}
          className="hover:underline"
        >
          ← Back
        </button>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="aspect-[4/3] w-full bg-gray-100">
            <img
              src={mediaUrl(product.image)}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        </div>

        {/* Details */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{product.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="text-xl font-semibold">{formatGBP(price)}</div>
            <div
              className={`text-xs px-2.5 py-1 rounded-full ${
                outOfStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {outOfStock ? 'Out of stock' : `In stock: ${product.stock_quantity}`}
            </div>
          </div>

          {product.description && (
            <p className="mt-4 text-gray-700 leading-relaxed">{product.description}</p>
          )}

          {/* Quantity + Actions */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="inline-flex items-center rounded-xl border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-sm hover:bg-gray-50 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-16 border-x border-gray-300 py-2 text-center text-sm focus:outline-none"
                aria-label="Quantity"
              />
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-2 text-sm hover:bg-gray-50 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Increase quantity"
              >
                +
              </button>
            </label>

            <button
              onClick={addToCart}
              disabled={outOfStock}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2
                ${outOfStock
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900'
                }`}
            >
              {outOfStock ? 'Unavailable' : 'Add to cart'}
            </button>
          </div>

          {/* Small meta */}
          <div className="mt-6 text-xs text-gray-500">
            Prices in GBP. Secure payments via Stripe.
          </div>
        </section>
      </div>
    </div>
  );
}
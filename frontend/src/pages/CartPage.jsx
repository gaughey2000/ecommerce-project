import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../services/api';
import { mediaUrl } from '../lib/media';
import SkeletonCard from '../components/SkeletonCard';

export default function CartPage() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  const hasItems = cart && cart.length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authFetch('/cart');
        if (!cancelled) setCart(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load cart', err);
        toast.error('Failed to load cart');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, it) => {
        const price = Number(it.price ?? 0);
        const qty = Number(it.quantity ?? 0);
        return sum + price * qty;
      }, 0),
    [cart]
  );

  const formatGBP = (n) => `£${Number(n).toFixed(2)}`;

  async function updateQuantity(cart_item_id, quantity) {
    if (quantity < 1) return;
    try {
      await authFetch(`/cart/${cart_item_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      setCart((prev) =>
        prev.map((it) => (it.cart_item_id === cart_item_id ? { ...it, quantity } : it))
      );
    } catch (err) {
      console.error(err);
      toast.error('Could not update quantity');
    }
  }

  async function removeItem(cart_item_id) {
    try {
      await authFetch(`/cart/${cart_item_id}`, { method: 'DELETE' });
      setCart((prev) => prev.filter((it) => it.cart_item_id !== cart_item_id));
      toast.success('Removed from cart');
    } catch (err) {
      console.error(err);
      toast.error('Could not remove item');
    }
  }

  async function checkout() {
    if (!hasItems) return toast.error('Your cart is empty');

    // Build payload matching your Swagger (server can also accept price_id items).
    const cartItems = cart.map((it) => ({
      name: it.name,
      description: it.description ?? undefined,
      // Convert decimal pounds to Stripe minor units (pence)
      unit_amount: Math.round(Number(it.price ?? 0) * 100),
      currency: 'GBP',
      quantity: Number(it.quantity ?? 1),
    }));

    const origin = window.location.origin;
    try {
      const data = await authFetch(
        '/checkout/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({
            cartItems,
            success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cart`,
          }),
        },
        true
      );

      if (data?.url) {
        window.location.assign(data.url);
      } else {
        toast.error('No checkout URL returned');
      }
    } catch (err) {
      console.error(err);
      // authFetch already toasts; this is a gentle fallback
      toast.error('Checkout failed');
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Cart</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review items, update quantities, and proceed to secure checkout.
        </p>
      </header>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={`cart-skel-${i}`} />
          ))}
        </div>
      ) : !hasItems ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <div className="mb-2 text-lg font-semibold text-gray-900">Your cart is empty</div>
          <p className="text-sm text-gray-600">Browse products and add your first item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Items */}
          <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold">Items</h2>
            </div>

            <ul className="divide-y divide-gray-100">
              {cart.map((it) => (
                <li key={it.cart_item_id} className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    {/* Image (optional) */}
                    <div className="hidden sm:block w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={mediaUrl(it.image || '/uploads/placeholder.jpg')}
                        alt={it.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold">{it.name}</h3>
                          {it.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                              {it.description}
                            </p>
                          )}
                          <div className="mt-2 text-sm text-gray-700">
                            Unit: <span className="font-medium">{formatGBP(it.price ?? 0)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-semibold">
                            {formatGBP((it.price ?? 0) * (it.quantity ?? 1))}
                          </div>
                        </div>
                      </div>

                      {/* Quantity controls */}
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-xl border border-gray-300 bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.cart_item_id, Number(it.quantity) - 1)}
                            className="px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-l-xl"
                            aria-label={`Decrease quantity of ${it.name}`}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              updateQuantity(it.cart_item_id, Math.max(1, Number(e.target.value)))
                            }
                            className="w-14 border-x border-gray-300 py-1.5 text-center text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.cart_item_id, Number(it.quantity) + 1)}
                            className="px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-r-xl"
                            aria-label={`Increase quantity of ${it.name}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(it.cart_item_id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Summary */}
          <aside className="h-max rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold">Summary</h2>
            </div>
            <div className="px-5 pb-5 pt-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatGBP(subtotal)}</span>
              </div>
              {/* Add shipping/taxes if you support them */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-semibold">{formatGBP(subtotal)}</span>
              </div>

              <button
                onClick={checkout}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                Proceed to checkout
              </button>

              <p className="text-xs text-gray-500">
                Payments processed securely by Stripe.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
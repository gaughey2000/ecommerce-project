import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { authFetch } from '../services/api';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id'); // Stripe adds this to success_url
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      toast.error('Missing session_id');
      navigate('/'); // bounce home if no session id
      return;
    }
    load(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function load(sid) {
    setLoading(true);
    try {
      const ord = await authFetch(`/orders/by-session/${sid}`);
      setOrder(ord || null);

      if (ord?.order_id) {
        const its = await authFetch(`/orders/${ord.order_id}/items`);
        setItems(Array.isArray(its) ? its : []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not load order');
    } finally {
      setLoading(false);
    }
  }

  const formatGBP = (n) => `£${Number(n ?? 0).toFixed(2)}`;
  const total = useMemo(
    () => (order?.total_amount != null ? Number(order.total_amount) : items.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0)),
    [order, items]
  );

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 print:px-0">
      {/* Top */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Thanks for your purchase!</h1>
        <p className="mt-1 text-sm text-gray-600">Your order has been received and is being processed.</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
            </div>
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="h-32 w-full rounded bg-gray-200" />
          </div>
        ) : !order ? (
          <div className="text-sm text-red-600">We couldn’t find that order.</div>
        ) : (
          <>
            {/* Header details */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm text-gray-600">Order</div>
                <div className="text-lg font-semibold">#{order.order_id}</div>
                <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Status</div>
                <div className="mt-0.5 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {order.status}
                </div>
              </div>
            </div>

            {/* Shipping & contact */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-700">Contact</div>
                <div className="mt-1 text-sm text-gray-900">{order.shipping_name || order.name || '—'}</div>
                <div className="text-sm text-gray-600">{order.shipping_email || order.email || '—'}</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-700">Shipping address</div>
                <div className="mt-1 whitespace-pre-line text-sm text-gray-900">
                  {order.shipping_address || order.address || '—'}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mt-6">
              <div className="text-sm font-medium text-gray-700 mb-2">Items</div>
              {items.length === 0 ? (
                <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">No line items found.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="py-2 pl-4 pr-4">Product ID</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Unit Price</th>
                        <th className="py-2 pr-4">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.order_item_id || `${order.order_id}-${it.product_id}`} className="border-t">
                          <td className="py-2 pl-4 pr-4">{it.product_id}</td>
                          <td className="py-2 pr-4">{it.quantity}</td>
                          <td className="py-2 pr-4">{formatGBP(it.unit_price)}</td>
                          <td className="py-2 pr-4">{formatGBP(Number(it.unit_price) * Number(it.quantity))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td className="py-3 pl-4 pr-4 text-sm font-medium" colSpan={3}>
                          Total
                        </td>
                        <td className="py-3 pr-4 text-sm font-semibold">{formatGBP(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Continue Shopping
              </Link>
              <Link
                to="/user"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                View My Orders
              </Link>
              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2
                  ${printing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-900'}`}
              >
                {printing ? 'Opening…' : 'Print Receipt'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Note */}
      <p className="mt-4 text-center text-xs text-gray-500">
        A confirmation has been sent to your email if available.
      </p>
    </div>
  );
}
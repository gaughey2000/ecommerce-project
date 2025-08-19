import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authFetch } from '../services/api';
import { mediaUrl } from '../lib/media';
import SkeletonCard from '../components/SkeletonCard';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [orderFilter, setOrderFilter] = useState('all'); // all | pending | shipped | paid | cancelled | delivered
  const [productQuery, setProductQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [u, o, p] = await Promise.all([
        authFetch('/admin/users'),
        authFetch('/admin/orders'),
        authFetch('/products'),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setOrders(Array.isArray(o) ? o : []);
      setProducts(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }

  // Actions
  async function deleteUser(userId) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await authFetch(`/admin/users/${userId}`, { method: 'DELETE' }, true);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  }

  async function archiveProduct(productId) {
    if (!window.confirm('Archive this product? It will be hidden from the store.')) return;
    try {
      await authFetch(`/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: false }),
      }, true);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error(err);
      toast.error('Failed to archive product');
    }
  }

  async function updateOrderStatus(orderId, status) {
    try {
      await authFetch(`/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }, true);
      // Update locally without full refetch
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order');
    }
  }

  // Filters
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [products, productQuery]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    );
  }, [users, userQuery]);

  // Helpers
  const formatGBP = (n) => `£${Number(n).toFixed(2)}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage users, products, and orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/add-product"
            className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            + Add Product
          </Link>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Users</div>
          <div className="mt-1 text-2xl font-semibold">{users.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Products</div>
          <div className="mt-1 text-2xl font-semibold">{products.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Orders</div>
          <div className="mt-1 text-2xl font-semibold">{orders.length}</div>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="mt-8 space-y-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={`admin-skel-${i}`} />
          ))}
        </div>
      ) : (
        <>
          {/* Users */}
          <section className="mt-10">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl sm:text-2xl font-semibold">Users</h2>
              <input
                type="search"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search by email or username"
                className="w-full sm:w-72 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm">
              {filteredUsers.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-gray-600">No users found.</li>
              )}
              {filteredUsers.map((user) => (
                <li key={user.user_id} className="px-4 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{user.email}</div>
                    <div className="text-xs text-gray-600 truncate">
                      {user.username || '—'}
                      {user.is_admin && (
                        <span className="ml-2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-medium text-white">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteUser(user.user_id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Orders */}
          <section className="mt-10">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl sm:text-2xl font-semibold">Orders</h2>
              <div className="flex flex-wrap items-center gap-2">
                {['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setOrderFilter(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition
                      ${orderFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    {s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <ul className="space-y-4">
              {filteredOrders.length === 0 && (
                <li className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
                  No orders for this filter.
                </li>
              )}

              {filteredOrders.map((order) => (
                <li
                  key={order.order_id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-600">Order</span>
                        <span className="font-semibold">#{order.order_id}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm">{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {order.user_email || order.email || '—'}
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="text-gray-600">Total:</span>{' '}
                        <span className="font-medium">
                          {formatGBP(order.total_amount ?? 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium
                        ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status}
                      </span>

                      {/* Quick actions */}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'shipped')}
                          className="rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          Mark shipped
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                          className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                          Mark delivered
                        </button>
                      )}
                      {order.status !== 'cancelled' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                          className="rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Products */}
          <section className="mt-10">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl sm:text-2xl font-semibold">Products</h2>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <input
                  type="search"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products"
                  className="w-full sm:w-72 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <Link
                  to="/admin/add-product"
                  className="hidden sm:inline-flex items-center rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  Add
                </Link>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.length === 0 && (
                <li className="col-span-full rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
                  No products found.
                </li>
              )}

              {filteredProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="aspect-[4/3] w-full bg-gray-100">
                    <img
                      src={mediaUrl(product.image || '/uploads/placeholder.jpg')}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold line-clamp-2">{product.name}</h3>
                      <span className="shrink-0 text-sm font-medium">
                        {typeof product.unit_amount === 'number'
                          ? `£${(product.unit_amount / 100).toFixed(2)}`
                          : `£${Number(product.price ?? 0).toFixed(2)}`}
                      </span>
                    </div>
                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-600">
                      Stock: <span className="font-medium">{product.stock_quantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-4">
                    <Link
                      to={`/admin/edit-product/${product.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => archiveProduct(product.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Archive
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
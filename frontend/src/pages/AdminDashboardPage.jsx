import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData().finally(() => setLoading(false));
  }, []);

  async function fetchAdminData() {
    try {
      const [u, o, p] = await Promise.all([
        authFetch('/admin/users'),
        authFetch('/admin/orders'),
        authFetch('/products'),
      ]);
      setUsers(u);
      setOrders(o);
      setProducts(p);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      toast.error('Failed to load admin data');
    }
  }

  async function deleteUser(userId) {
    if (!window.confirm('Delete this user?')) return;
    try {
      await authFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      fetchAdminData();
      toast.success('User deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  }

  async function deleteProduct(productId) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await authFetch(`/admin/products/${productId}`, { method: 'DELETE' });
      fetchAdminData();
      toast.success('Product deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  }

  async function markAsShipped(orderId) {
    try {
      await authFetch(`/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      });
      fetchAdminData();
      toast.success('Order marked as shipped');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order');
    }
  }

  const filteredOrders = orders.filter(order => order.status === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      <h1 className="text-3xl font-bold text-center">Admin Dashboard</h1>

      {loading ? (
        <>
          <div className="flex justify-center gap-8 mt-6 text-sm text-gray-600 animate-pulse">
            <span>👥 Loading users...</span>
            <span>📦 Loading products...</span>
            <span>🧾 Loading orders...</span>
          </div>
          <div className="space-y-4 mt-6">
            {[...Array(3)].map((_, i) => <SkeletonCard key={`user-skeleton-${i}`} />)}
            {[...Array(3)].map((_, i) => <SkeletonCard key={`order-skeleton-${i}`} />)}
            {[...Array(3)].map((_, i) => <SkeletonCard key={`product-skeleton-${i}`} />)}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-center gap-8 mt-6 text-sm text-gray-600">
            <span>👥 Users: {users.length}</span>
            <span>📦 Products: {products.length}</span>
            <span>🧾 Orders: {orders.length}</span>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Users</h2>
            <ul className="space-y-2">
              {users.map(user => (
                <li key={user.user_id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <span>
                    {user.email}
                    {user.is_admin && (
                      <span className="ml-2 text-xs text-white bg-purple-600 px-2 py-0.5 rounded-full">Admin</span>
                    )}
                  </span>
                  <button
                    onClick={() => deleteUser(user.user_id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-2xl font-semibold">Orders</h2>
              <div className="space-x-2">
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-1 rounded ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('shipped')}
                  className={`px-4 py-1 rounded ${filter === 'shipped' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Shipped
                </button>
              </div>
            </div>
            <ul className="space-y-4">
              {filteredOrders.map(order => (
                <li key={order.order_id} className="bg-white border shadow p-4 rounded">
                  <p><strong>ID:</strong> {order.order_id}</p>
                  <p><strong>Email:</strong> {order.user_email || 'N/A'}</p>
                  <p><strong>Status:</strong>{' '}
                    <span className={order.status === 'pending' ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'}>
                      {order.status}
                    </span>
                  </p>
                  <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => markAsShipped(order.order_id)}
                      className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Mark as Shipped
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Products</h2>
              <Link
                to="/admin/add-product"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add New Product
              </Link>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(product => (
                <li key={product.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <span>{product.name}</span>
                  <div className="space-x-2">
                    <Link to={`/admin/edit-product/${product.id}`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
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
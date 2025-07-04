import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orderItems, setOrderItems] = useState({});
  const navigate = useNavigate();
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      const [uRes, oRes, pRes] = await Promise.all([
        authFetch('/admin/users'),
        authFetch('/admin/orders'),
        authFetch('/products'),
      ]);

      if (!uRes.ok || !oRes.ok || !pRes.ok) {
        throw new Error('One or more admin fetches failed');
      }

      const [u, o, p] = await Promise.all([
        uRes.json(),
        oRes.json(),
        pRes.json(),
      ]);

      console.log('Fetched products:', p);

      setUsers(u);
      setOrders(o);
      setProducts(p);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    }
  }

  async function markAsShipped(orderId) {
    try {
      const res = await authFetch(`/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      });
      if (!res.ok) throw new Error('Failed to update order');
      await fetchAdminData();
    } catch (err) {
      console.error(`Failed to mark order ${orderId} as shipped:`, err);
    }
  }

  async function toggleOrderItems(orderId) {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));

    if (!orderItems[orderId]) {
      try {
        const res = await authFetch(`/orders/${orderId}/items`);
        if (!res.ok) throw new Error('Failed to fetch order items');
        const items = await res.json();

        const enrichedItems = items.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            ...item,
            productName: product?.name || `Product #${item.product_id}`,
          };
        });

        setOrderItems(prev => ({ ...prev, [orderId]: enrichedItems }));
      } catch (err) {
        console.error(`Failed to fetch items for order ${orderId}:`, err);
      }
    }
  }
  const toggleOrderDetails = async (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  
    if (!orderItems[orderId]) {
      const res = await authFetch(`/admin/orders/${orderId}/items`);
      if (res.ok) {
        const data = await res.json();
        setOrderItems(prev => ({ ...prev, [orderId]: data }));
      }
    }
  };

  async function deleteUser(userId) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await authFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchAdminData();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }

  async function deleteProduct(productId) {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await authFetch(`/admin/products/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchAdminData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  }

  const filteredOrders = orders.filter(order => order.status === filter);
  function StatCard({ title, value }) {
    return (
      <div className="bg-white p-4 rounded shadow text-center">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Users" value={users.length} />
        <StatCard title="Total Orders" value={orders.length} />
        <StatCard title="Total Revenue" value={`£${totalRevenue.toFixed(2)}`} />
      </div>

      {/* USERS */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Users</h2>
        {users.length ? (
          <ul className="space-y-2">
            {users.map(user => (
              <li key={user.user_id} className="bg-gray-100 p-2 rounded shadow flex justify-between items-center">
                <div>
                  {user.email}{' '}
                  {user.is_admin && <span className="ml-2 text-xs text-white bg-purple-600 px-2 py-0.5 rounded-full">Admin</span>}
                </div>
                <button
                  onClick={() => deleteUser(user.user_id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : <p>No users found.</p>}
      </section>

      {/* ORDERS */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
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

        {filteredOrders.length ? (
          <ul className="space-y-4">
            {filteredOrders.map(order => (
              <li key={order.order_id} className="bg-white border shadow p-4 rounded space-y-1">
                <p><strong>ID:</strong> {order.order_id}</p>
                <p><strong>Email:</strong> {order.user_email || 'N/A'}</p>
                <p><strong>Status:</strong>{' '}
                  <span className={`font-semibold ${order.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>{order.status}</span>
                </p>
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                <button
                  onClick={() => toggleOrderItems(order.order_id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {expandedOrders[order.order_id] ? 'Hide items' : 'View items'}
                </button>
                {expandedOrders[order.order_id] && (
                  <ul className="mt-2 pl-4 border-l border-gray-300">
                    {(orderItems[order.order_id] || []).map(item => (
                      <li key={item.order_item_id}>
                        {item.quantity} × {item.productName} @ £{Number(item.unit_price).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                )}
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
        ) : <p>No {filter} orders found.</p>}
      </section>

      {/* PRODUCTS */}
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
        {products.length ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {products.map(product => (
              <li key={product.id} className="bg-gray-100 p-2 rounded shadow flex justify-between items-center">
                <span>{product.name}</span>
                <div className="space-x-2">
                  <Link to={`/admin/edit-product/${product.id}`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                  <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:underline text-sm">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p>No products found.</p>}
      </section>
    </div>
  );
}
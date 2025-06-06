import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import { Link } from 'react-router-dom';


export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchAdminData() {
      const [u, o, p] = await Promise.all([
        authFetch('/admin/users').then(r => r.json()),
        authFetch('/admin/orders').then(r => r.json()),
        authFetch('/products').then(r => r.json()),
      ]);
      setUsers(u);
      setOrders(o);
      setProducts(p);
    }
    fetchAdminData();
  }, []);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <section>
        <h2>Users</h2>
        <ul>{users.map(user => <li key={user.id}>{user.email}</li>)}</ul>
      </section>
      <section>
        <h2>Orders</h2>
        <ul>{orders.map(order => <li key={order.id}>{order.status}</li>)}</ul>
      </section>
      <section>
        <Link
          to="/admin/add-product"
          className="inline-block mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add New Product
        </Link>
        <h2>Products</h2>
        <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>
      </section>
    </div>
  );
}
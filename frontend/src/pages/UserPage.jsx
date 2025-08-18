import { useEffect, useState, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';

export default function UserPage() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileData, ordersData] = await Promise.all([
          authFetch('/users/me'),
          authFetch('/orders'),
        ]);
        setProfile({ username: profileData.username, email: profileData.email });
        setOrders(ordersData || []);
      } catch {
        toast.error('Failed to load profile or orders');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleProfileChange = (e) =>
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await authFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: profile.username, email: profile.email }),
      }, true);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm)
      return toast.error('Passwords do not match');
    try {
      await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
        }),
      }, true);
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await authFetch('/users/me', { method: 'DELETE' }, true);
      logout();
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    }
  };

  if (loading) return <SkeletonCard count={1} />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <section>
        <h2 className="text-xl font-bold mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-3">
          <input
            name="username"
            value={profile.username}
            onChange={handleProfileChange}
            placeholder="Username"
            className="w-full border p-2 rounded"
          />
          <input
            name="email"
            type="email"
            value={profile.email}
            onChange={handleProfileChange}
            placeholder="Email"
            className="w-full border p-2 rounded"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm((s) => ({ ...s, current: e.target.value }))}
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            placeholder="New password"
            value={passwordForm.next}
            onChange={(e) => setPasswordForm((s) => ({ ...s, next: e.target.value }))}
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm((s) => ({ ...s, confirm: e.target.value }))}
            className="w-full border p-2 rounded"
          />
          <button className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded">
            Change Password
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Orders</h2>
        <ul className="space-y-2">
          {orders.length ? (
            orders.map(o => (
              <li key={o.order_id} className="border rounded p-3">
                <div className="text-sm text-gray-600">Order #{o.order_id}</div>
                <div>Status: {o.status}</div>
                <div>Total: £{Number(o.total_amount).toFixed(2)}</div>
              </li>
            ))
          ) : (
            <p className="text-gray-600">No orders yet.</p>
          )}
        </ul>
      </section>

      <section className="text-center">
        <button
          onClick={deleteAccount}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Delete My Account
        </button>
      </section>
    </div>
  );
}
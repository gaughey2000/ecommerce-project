import { useEffect, useState, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';

export default function UserPage() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await authFetch('/users/me');
        const ordersData = await authFetch('/orders');
        setProfile(profileData);
        setOrders(ordersData);
      } catch (err) {
        toast.error('Failed to load profile or orders');
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchData();
  }, []);

  const handleProfileChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handlePwChange = e => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const updateProfile = async e => {
    e.preventDefault();
    try {
      await authFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      }, true); // enable toast on success
    } catch (err) {
      toast.error('❌ Something went wrong updating your profile.');
    }
  };

  const changePassword = async e => {
    e.preventDefault();
    const { current, new: newPw, confirm } = passwordForm;

    if (!current || !newPw || !confirm) return toast.error('All fields are required');
    if (newPw !== confirm) return toast.error('New passwords do not match');
    if (newPw.length < 8 || !/[A-Z]/.test(newPw) || !/\d/.test(newPw)) {
      return toast.error('Password must be 8+ characters, with 1 uppercase & 1 number');
    }

    try {
      await authFetch('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      }, true); // enable toast on success

      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('⚠️ This will permanently delete your account and order history. Continue?')) return;
    try {
      await authFetch('/users/me', { method: 'DELETE' }, true);
      logout();
    } catch (err) {
      toast.error('Could not delete account');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-12">
      <h1 className="text-3xl font-bold text-center">My Profile</h1>

      <div className="flex flex-col items-center">
        <img
          src={preview || profile.profile_image || '/default-avatar.png'}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover mb-2 border"
        />
        <label className="text-blue-600 text-sm cursor-pointer hover:underline">
          Change photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async e => {
              const file = e.target.files[0];
              if (!file || !file.type.startsWith('image/')) return toast.error('Not an image');
              if (file.size > 2 * 1024 * 1024) return toast.error('Max file size is 2MB');

              const objectUrl = URL.createObjectURL(file);
              setPreview(objectUrl);
              const formData = new FormData();
              formData.append('image', file);

              try {
                const updated = await authFetch('/users/me/image', { method: 'POST', body: formData }, true);
                setProfile(p => ({ ...p, profile_image: updated.profile_image }));
              } catch {
                toast.error('❌ Image upload failed');
              } finally {
                URL.revokeObjectURL(objectUrl);
              }
            }}
          />
        </label>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Account Details</h2>
        <form onSubmit={updateProfile} className="space-y-4">
          <input
            name="username"
            value={profile.username}
            onChange={handleProfileChange}
            className="w-full border p-2 rounded"
            placeholder="Name"
          />
          <input
            name="email"
            type="email"
            value={profile.email}
            onChange={handleProfileChange}
            className="w-full border p-2 rounded"
            placeholder="Email"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Update Profile
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <input
            type="password"
            name="current"
            value={passwordForm.current}
            onChange={handlePwChange}
            autoComplete="off"
            className="w-full border p-2 rounded"
            placeholder="Current Password"
          />
          <input
            type="password"
            name="new"
            value={passwordForm.new}
            onChange={handlePwChange}
            autoComplete="off"
            className="w-full border p-2 rounded"
            placeholder="New Password"
          />
          <input
            type="password"
            name="confirm"
            value={passwordForm.confirm}
            onChange={handlePwChange}
            autoComplete="off"
            className="w-full border p-2 rounded"
            placeholder="Confirm Password"
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Change Password
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Order History</h2>
        <ul className="space-y-3">
          {loadingOrders ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : orders.length > 0 ? (
            orders.map(order => (
              <li key={order.order_id} className="border rounded p-3 bg-white shadow-sm">
                <div><strong>ID:</strong> {order.order_id}</div>
                <div><strong>Status:</strong> {order.status}</div>
                <div><strong>Total:</strong> £{Number(order.total_amount).toFixed(2)}</div>
                <div><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</div>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No past orders found.</p>
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
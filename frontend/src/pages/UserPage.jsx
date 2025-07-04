import { useEffect, useState, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function UserPage() {
  const { user, login, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resProfile = await authFetch('/users/me');
        const resOrders = await authFetch('/orders');
        if (resProfile.ok) setProfile(await resProfile.json());
        if (resOrders.ok) setOrders(await resOrders.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleProfileChange = e =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handlePwChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };
    

  const updateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!profile.username || !profile.email) {
      setMessage('❌ Both name and email are required');
      return;
    }
    if (!emailRegex.test(profile.email)) {
      setMessage('❌ Please enter a valid email address');
      return;
    }
  
    try {
      const res = await authFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('✅ Profile updated successfully');
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');
  
    const { current, new: newPw, confirm } = passwordForm;
  
    if (!current || !newPw || !confirm) {
      setPwMessage('❌ All fields are required');
      return;
    }
    if (newPw !== confirm) {
      setPwMessage('❌ New passwords do not match');
      return;
    }
    if (newPw.length < 8 || !/[A-Z]/.test(newPw) || !/\d/.test(newPw)) {
      setPwMessage('❌ Password must be 8+ chars, include 1 uppercase and 1 number');
      return;
    }
  
    try {
      const res = await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current, new: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwMessage('✅ Password updated!');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPwMessage(`❌ ${err.message}`);
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 space-y-12">
      <h1 className="text-3xl font-bold text-center">My Profile</h1>
      <div className="flex flex-col items-center mb-6">
      <img
        src={preview || profile.profile_image || '/default-avatar.png'}
        alt="Profile"
      />
        <label className="text-blue-600 cursor-pointer text-sm hover:underline">
          Change photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              setPreview(URL.createObjectURL(file));
              const formData = new FormData();
              if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
              }
              
              if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('Image must be under 2MB');
                return;
              }
              formData.append('image', file);
              const res = await authFetch('/users/me/image', {
                method: 'POST',
                body: formData,
              });
              
              if (res.ok) {
                const updated = await res.json();
                setProfile(prev => ({ ...prev, profile_image: updated.profile_image }));
              }
            }}
          />
        </label>
      </div>
      {/* Profile Update */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Account Details</h2>
        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="username"
              value={profile.username}
              onChange={handleProfileChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={profile.email}
              onChange={handleProfileChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Update Profile
          </button>
          {message && <p className="text-sm mt-2 text-green-600">{message}</p>}
        </form>
      </section>

      {/* Password Change */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              name="current"
              value={passwordForm.current}
              onChange={handlePwChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              name="new"
              value={passwordForm.new}
              onChange={handlePwChange}
              className="w-full border p-2 rounded"
            />
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                name="confirm"
                value={passwordForm.confirm}
                onChange={handlePwChange}
                className="w-full border p-2 rounded"
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Change Password
          </button>
          {pwMessage && <p className="text-sm mt-2 text-green-600">{pwMessage}</p>}
        </form>
      </section>

      {/* Order History */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Order History</h2>
        <ul className="space-y-3">
          {orders.length > 0 ? (
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
          onClick={async () => {
            if (!confirm('Are you sure you want to delete your account?')) return;
            const res = await authFetch('/users/me', { method: 'DELETE' });
            if (res.ok) {
              alert('Your account has been deleted.');
              logout();
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Delete My Account
        </button>
      </section>
    </div>
  );
}
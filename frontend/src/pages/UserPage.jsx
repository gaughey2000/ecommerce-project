import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../services/api';
import ChangePasswordForm from '../components/ChangePasswordForm';
export default function UserPage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Change password form
  const [cp, setCp] = useState({ currentPassword: '', newPassword: '' });
  const [cpLoading, setCpLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([authFetch('/users/me'), authFetch('/orders')])
      .then(([me, os]) => {
        if (!isMounted) return;
        setProfile(me);
        setOrders(os || []);
      })
      .catch(() => toast.error('Failed to load profile or orders'))
      .finally(() => isMounted && setLoading(false));
    return () => { isMounted = false; };
  }, []);

  async function onChangePassword(e) {
    e.preventDefault();
    setCpLoading(true);
    try {
      await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(cp),
      }, true);
      setCp({ currentPassword: '', newPassword: '' });
    } catch (err) {
      // toast shown in authFetch
    } finally {
      setCpLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-6 w-40 bg-gray-200 animate-pulse rounded" />
        <div className="mt-6 h-40 bg-gray-100 animate-pulse rounded" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Your Account</h1>
      {profile && (
        <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">
          <p><span className="font-medium">Username:</span> {profile.username}</p>
          <p className="mt-1"><span className="font-medium">Email:</span> {profile.email}</p>
        </div>
      )}

      {/* Change Password */}
      <section className="mt-10 max-w-md">
        <h2 className="text-xl font-semibold mb-3">Change Password</h2>
        <ChangePasswordForm onSuccess={() => { /* optional: show any extra UI */ }} />
      </section>

      {/* Orders */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Your Orders</h2>
        <div className="mt-4 grid gap-4">
          {(orders || []).map((o) => (
            <div key={o.order_id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Order #{o.order_id}</p>
                  <p className="text-sm text-gray-600">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                  {o.status}
                </span>
              </div>
            </div>
          ))}
          {(!orders || orders.length === 0) && (
            <p className="text-gray-600">No orders yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
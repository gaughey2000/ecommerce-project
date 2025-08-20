import { useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '../services/api';

export default function ChangePasswordForm({ onSuccess }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(form),
      }, true);
      setForm({ currentPassword: '', newPassword: '' });
      onSuccess?.();
    } catch (err) {
      // toasts handled in authFetch when showToast=true
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-700">Current Password</label>
        <input
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm((s) => ({ ...s, currentPassword: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700">New Password</label>
        <input
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((s) => ({ ...s, newPassword: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
          required
          minLength={8}
        />
      </div>
      <button
        disabled={loading}
        className="rounded-lg bg-gray-900 px-4 py-2 text-white font-medium hover:bg-gray-800 disabled:opacity-60"
      >
        {loading ? 'Updating…' : 'Change Password'}
      </button>
    </form>
  );
}
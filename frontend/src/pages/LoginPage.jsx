import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');

      login({
        token: data.token,
        email: data.email,
        username: data.username,
        role: data.role,
      });

      toast.success('Welcome back!');
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSuccess(data) {
    login({
      token: data.token,
      email: data.email,
      username: data.username,
      role: data.role,
    });
    toast.success('Logged in with Google');
    const redirectTo = location.state?.from || '/';
    navigate(redirectTo, { replace: true });
  }

  return (
    <main className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Login</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
          />
        </div>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white font-medium hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs uppercase tracking-wide text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Google Login */}
      <GoogleLoginButton onSuccess={handleGoogleSuccess} />

      {/* Cross-link */}
      <p className="mt-4 text-sm text-gray-600">
        Don’t have an account?{' '}
        <Link to="/register" className="font-medium text-gray-900 hover:underline">
          Register
        </Link>
      </p>
    </main>
  );
}
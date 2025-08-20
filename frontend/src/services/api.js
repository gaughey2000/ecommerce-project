import { toast } from 'sonner';

export const API_BASE_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')}/api`;

export async function authFetch(url, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (res.status === 204) return null;

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'Something went wrong');
      throw new Error(data?.error || 'Something went wrong');
    }
    return data;
  } catch (err) {
    console.error('authFetch error:', err);
    toast.error(err.message);
    throw err;
  }
}
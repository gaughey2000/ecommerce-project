import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:3000/api';
console.log('Token being sent:', localStorage.getItem('token'));
export const authFetch = async (endpoint, options = {}, showToast = false) => {
  const token = localStorage.getItem('token');

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      if (showToast) toast.error(data.error || 'Something went wrong');
      throw new Error(data.error || 'Request failed');
    }

    if (showToast) toast.success(data.message || 'Success');
    return data;
  } catch (err) {
    if (showToast) toast.error(err.message || 'Request failed');
    throw err;
  }
};
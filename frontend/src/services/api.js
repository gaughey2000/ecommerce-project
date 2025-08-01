import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:3000/api';

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

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let data = null;
    if (isJson) {
      data = await res.json();
    }

    if (!res.ok) {
      if (showToast) toast.error(data?.error || 'Something went wrong');
      throw new Error(data?.error || 'Request failed');
    }

    if (showToast && data?.message) toast.success(data.message);

    return data ?? {}; // ✅ Always return an object
  } catch (err) {
    if (showToast) toast.error(err.message || 'Request failed');
    throw err;
  }
};
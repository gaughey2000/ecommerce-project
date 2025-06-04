const API_BASE_URL = 'http://localhost:3000/api';

export const authFetch = (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  console.log('Sending token:', token);
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

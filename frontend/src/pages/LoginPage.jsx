import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';


export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
  
    try {
      const res = await authFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
  
      // Store in context and localStorage via login()
      login({
        token: data.token,
        email: data.email,
        username: data.username,  // ✅ now included
        isAdmin: data.isAdmin,
      });
  
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      {error && <p className="text-red-500">{error}</p>}
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="block w-full mb-2 p-2 border"
      />
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Password"
        className="block w-full mb-4 p-2 border"
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
    </form>
  );
}


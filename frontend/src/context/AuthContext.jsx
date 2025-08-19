import { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

function decodeSafe(token) {
  try {
    const decoded = jwtDecode(token);
    // If token has exp (seconds), ensure it's not expired
    if (decoded?.exp && Date.now() >= decoded.exp * 1000) return null;
    return decoded;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email') || '';
    const username = localStorage.getItem('username') || '';

    if (!token || !email) return null;
    const decoded = decodeSafe(token);
    if (!decoded) {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('username');
      return null;
    }

    const role = decoded.role || 'user';
    return { token, email, username, role, isAdmin: role === 'admin' };
  });

  const login = ({ token, email, username, role }) => {
    const decoded = decodeSafe(token);
    if (!decoded) return;

    const userRole = role || decoded.role || 'user';
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('username', username || '');

    setUser({
      token,
      email,
      username: username || '',
      role: userRole,
      isAdmin: userRole === 'admin',
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
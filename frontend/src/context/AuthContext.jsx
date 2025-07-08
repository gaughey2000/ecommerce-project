import { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');

    if (!token || !email) return null;

    try {
      const decoded = jwtDecode(token);
      return {
        token,
        email,
        username,
        role: decoded.role,
        isAdmin: decoded.role === 'admin',
      };
    } catch (err) {
      console.error('Invalid token', err);
      return null;
    }
  });

  const login = ({ token, email, username, role }) => {
    try {
      const decoded = jwtDecode(token);
      const userRole = role || decoded.role;

      localStorage.setItem('token', token);
      localStorage.setItem('email', email);
      localStorage.setItem('username', username || '');

      setUser({
        token,
        email,
        username,
        role: userRole,
        isAdmin: userRole === 'admin',
      });
    } catch (err) {
      console.error('Token decode failed', err);
    }
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
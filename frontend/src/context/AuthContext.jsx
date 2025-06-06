import { createContext, useState } from 'react';
import { useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return { token, email, isAdmin: decoded.isAdmin };
    } catch (err) {
      console.error('Invalid token', err);
      return null;
    }
  });

  const login = ({ token, email }) => {
    try {
      const decoded = jwtDecode(token);
      localStorage.setItem('token', token);
      localStorage.setItem('email', email);
      setUser({ token, email, isAdmin: decoded.isAdmin });
    } catch (err) {
      console.error('Token decode failed', err);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


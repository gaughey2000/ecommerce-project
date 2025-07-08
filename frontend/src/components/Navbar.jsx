import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white px-4 sm:px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold hover:text-blue-400">Home</Link>

          <button
            className="sm:hidden text-white focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link to="/products" className="hover:text-blue-400">Products</Link>
              <Link to="/cart" className="hover:text-blue-400">Cart</Link>
              <Link to="/checkout" className="hover:text-blue-400">Checkout</Link>
              <Link to="/user" className="hover:text-blue-400">My Account</Link>
              {user.role === 'admin' && <Link to="/admin" className="hover:text-yellow-400">Admin Panel</Link>}
              <span className="text-gray-300">Olá, <strong>{user.username || user.email}</strong></span>
              {user.role === 'admin' && <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">Admin</span>}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded"
              >Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded">Login</Link>
              <Link to="/register" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1.5 rounded">Register</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden mt-4 space-y-2 text-sm px-4">
          {user ? (
            <>
              <Link to="/products" className="block hover:text-blue-400">Products</Link>
              <Link to="/cart" className="block hover:text-blue-400">Cart</Link>
              <Link to="/checkout" className="block hover:text-blue-400">Checkout</Link>
              <Link to="/user" className="block hover:text-blue-400">My Account</Link>
              {user.role === 'admin' && <Link to="/admin" className="block hover:text-yellow-400">Admin Panel</Link>}
              <p className="text-gray-300">Olá, <strong>{user.username || user.email}</strong></p>
              {user.role === 'admin' && <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">Admin</span>}
              <button
                onClick={handleLogout}
                className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Login</Link>
              <Link to="/register" className="block bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Nav */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-blue-400 transition-colors">
            Home
          </Link>
          {user && (
            <>
              <Link to="/products" className="hover:text-blue-400 transition-colors">
                Products
              </Link>
              <Link to="/cart" className="hover:text-blue-400 transition-colors">
                Cart
              </Link>
              <Link to="/checkout" className="hover:text-blue-400 transition-colors">
                Checkout
              </Link>
              <Link to="/user" className="hover:text-blue-400 transition-colors">
                My Account
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="hover:text-yellow-400 transition-colors">
                  Admin Panel
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right Auth Area */}
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <span className="text-gray-300 flex items-center gap-2">
                Logged in as{' '}
                <span className="font-semibold text-white">{user.email}</span>
                {user.isAdmin && (
                  <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
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
    <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <div className="flex gap-4">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        {user && (
          <>
            <Link to="/cart" className="hover:underline">
              Cart
            </Link>
            <Link to="/checkout" className="hover:underline">
              Checkout
            </Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm">
              Logged in as <strong>{user.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

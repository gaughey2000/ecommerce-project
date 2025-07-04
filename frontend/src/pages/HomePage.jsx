import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { user } = useContext(AuthContext);
  const email = localStorage.getItem('email');

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Welcome 👋</h1>
        <p className="text-gray-700 mb-6 text-base sm:text-lg">
          {email ? `Logged in as ${email}` : 'You are logged in.'}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/products"
            className="text-center bg-blue-600 text-white py-3 px-4 rounded shadow hover:bg-blue-700 transition"
          >
            Browse Products
          </Link>
          <Link
            to="/user"
            className="text-center bg-gray-600 text-white py-3 px-4 rounded shadow hover:bg-gray-700 transition"
          >
            View Profile & Orders
          </Link>
          <Link
            to="/cart"
            className="text-center bg-green-600 text-white py-3 px-4 rounded shadow hover:bg-green-700 transition"
          >
            View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
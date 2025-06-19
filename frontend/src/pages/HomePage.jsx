import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { user } = useContext(AuthContext);
  const email = localStorage.getItem('email');

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome 👋</h1>
      <p className="text-gray-700 mb-6">
        {email ? `Logged in as ${email}` : 'You are logged in.'}
      </p>

      <div className="space-y-4">
        <Link
          to="/products"
          className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Browse Products
        </Link>
        <Link
          to="/user"
          className="block w-full text-center bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
        >
          View Profile & Orders
        </Link>
        <Link
          to="/cart"
          className="block w-full text-center bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          View Cart
        </Link>
      </div>
    </div>
  );
}
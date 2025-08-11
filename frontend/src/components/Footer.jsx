import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left */}
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Your Store. All rights reserved.
        </p>

        {/* Middle Links */}
        <div className="flex gap-4 text-sm">
          <Link to="/" className="hover:text-blue-400">Home</Link>
          <Link to="/products" className="hover:text-blue-400">Products</Link>
          <Link to="/cart" className="hover:text-blue-400">Cart</Link>
          <Link to="/user" className="hover:text-blue-400">My Account</Link>
        </div>

        {/* Right */}
        <p className="text-xs text-gray-500">
          Built with ❤️ using PERN Stack
        </p>
      </div>
    </footer>
  );
}
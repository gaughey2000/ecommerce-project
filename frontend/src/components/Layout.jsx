import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="bg-gray-100 min-h-screen text-gray-900">
      <header className="bg-white shadow mb-6">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">MyShop</Link>
          <div className="space-x-4">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/cart" className="hover:underline">Cart</Link>
            <Link to="/admin" className="hover:underline">Admin</Link>
          </div>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-4">{children}</main>
    </div>
  );
}
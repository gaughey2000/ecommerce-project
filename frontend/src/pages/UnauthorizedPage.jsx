import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="text-gray-700 mb-6">
        You don't have permission to view this page.
      </p>
      <Link
        to="/"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Go back home
      </Link>
    </div>
  );
}
import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded shadow-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="text-gray-700">You do not have permission to access this page.</p>
        <Link
          to="/"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
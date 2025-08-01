import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 px-4 text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-gray-700 text-lg mb-6">Oops! The page you’re looking for doesn’t exist.</p>
      <Link
        to="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Go Back Home
      </Link>
    </div>
  );
}
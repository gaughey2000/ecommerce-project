import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // not logged in → redirect to login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.isAdmin) {
    // logged in but not admin → redirect to unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
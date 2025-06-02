import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProductListPage from './pages/ProductListPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CartPage from './pages/CartPage';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ProductListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cart" element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

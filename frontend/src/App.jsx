import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProductListPage from './pages/ProductListPage';
import ProtectedRoute from './components/ProtectedRoute';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminRoute from './components/AdminRoute';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import UserPage from './pages/UserPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Layout from './components/Layout';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/products" element={<ProductListPage />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-confirmation/:orderId"
          element={
            <ProtectedRoute>
              <OrderConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/add-product"
          element={
            <AdminRoute>
              <AddProductPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/edit-product/:id"
          element={
            <AdminRoute>
              <EditProductPage />
            </AdminRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Outside layout (no nav) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Routes>
  );
}
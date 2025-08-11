import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';
export default function Layout() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
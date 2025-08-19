import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Add subtle shadow on scroll
  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 2);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItemClass = ({ isActive }) =>
    `inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition
     ${isActive ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`;

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60
      ${elevated ? 'shadow-sm border-b border-gray-200' : ''}`}
      role="banner"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16" aria-label="Global">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gray-900 text-white grid place-items-center text-xs font-bold">
              ECOM
            </div>
            <span className="sr-only">Home</span>
          </Link>
          <div className="hidden sm:flex sm:items-center sm:gap-1">
            <NavLink to="/" className={navItemClass} end>Home</NavLink>
            <NavLink to="/products" className={navItemClass}>Shop</NavLink>
            <NavLink to="/about" className={navItemClass}>About</NavLink>
          </div>
        </div>

        {/* Right: Actions (desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <NavLink to="/cart" className={navItemClass} aria-label="Cart">
            🛒 <span className="ml-1 hidden md:inline">Cart</span>
          </NavLink>

          {user ? (
            <>
              {user.isAdmin && (
                <NavLink to="/admin" className={navItemClass}>Admin</NavLink>
              )}
              <NavLink to="/user" className={navItemClass}>Account</NavLink>
              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navItemClass}>Login</NavLink>
              <Link
                to="/register"
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <span className="sr-only">Open main menu</span>
          {open ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`sm:hidden border-t border-gray-200 bg-white transition-[max-height] duration-200 overflow-hidden ${open ? 'max-h-96' : 'max-h-0'}`}
      >
        <div className="px-4 py-3 space-y-1">
          <NavLink to="/" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" end>Home</NavLink>
          <NavLink to="/products" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Shop</NavLink>
          <NavLink to="/about" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">About</NavLink>

          <div className="my-2 border-t border-gray-200" />

          <NavLink to="/cart" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cart</NavLink>

          {user ? (
            <>
              {user.isAdmin && (
                <NavLink to="/admin" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Admin
                </NavLink>
              )}
              <NavLink to="/user" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Account
              </NavLink>
              <button
                onClick={handleLogout}
                className="mt-2 w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Login
              </NavLink>
              <Link
                to="/register"
                className="mt-1 block rounded-lg bg-gray-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
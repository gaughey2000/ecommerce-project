import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Welcome to the Store
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-gray-600">
          A clean, modern e-commerce demo built with the PERN stack. Browse products, manage your cart,
          and check out securely.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Shop Products
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            View Orders
          </Link>
        </div>
      </section>

      {/* Highlights */}
      <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Secure Checkout', desc: 'Stripe-powered payments in test mode.', emoji: '💳' },
          { title: 'Admin Tools', desc: 'Manage products, users, and orders.', emoji: '🛠️' },
          { title: 'Mobile Friendly', desc: 'Responsive Tailwind UI.', emoji: '📱' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-3xl">{f.emoji}</div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-gray-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
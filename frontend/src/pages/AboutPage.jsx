export default function AboutPage() {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">About this project</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          This application was built as part of my Codecademy course project. It’s a full-stack
          e-commerce app using the PERN stack (PostgreSQL, Express, React, Node.js).
          Users can browse products, add items to a cart, check out via Stripe, and review past orders.
          Admins can manage products, users, and orders.
        </p>
        <p className="mt-3 text-gray-700 leading-relaxed">
          The goal of the project is to demonstrate practical skills across frontend and backend:
          authentication (JWT), role-based authorization, REST API design, database modeling,
          file uploads, and deployment readiness.
        </p>
        <p className="mt-3 text-gray-700">
          Thanks for taking a look!
        </p>
      </main>
    );
  }
🛒 PERN E-commerce App

A full-stack e-commerce application built with PostgreSQL, Express.js, React, and Node.js (PERN). Features role-based authentication, product management, cart and checkout, admin dashboard, and image uploads.

⸻

🚀 Getting Started

🧱 Prerequisites
	•	Node.js v18+
	•	PostgreSQL
	•	Yarn or npm

🔧 Backend Setup

cd backend
cp .env.example .env
yarn install
yarn dev

🎨 Frontend Setup

cd frontend
yarn install
yarn dev


⸻

🔑 Environment Variables

See .env.example for required variables.

Backend:
	•	PORT
	•	DATABASE_URL
	•	JWT_SECRET
	•	NODE_ENV
	•	CLOUDINARY_URL (if using Cloudinary for images)

Frontend:
	•	VITE_API_URL
	•	VITE_GOOGLE_CLIENT_ID

⸻

📬 API Routes Summary

Auth
	•	POST /auth/register
	•	POST /auth/login
	•	POST /auth/google
	•	POST /auth/change-password

Users
	•	GET /users/me
	•	PATCH /users/me

Products
	•	GET /products
	•	GET /products/:id
	•	POST /products (admin only)
	•	PUT /products/:id (admin only)
	•	DELETE /products/:id (admin only)

Cart
	•	GET /cart
	•	POST /cart
	•	PATCH /cart/:itemId
	•	DELETE /cart/:itemId

Orders
	•	GET /orders
	•	POST /orders/checkout

Admin (Protected)
	•	GET /admin/users
	•	GET /admin/orders

⸻

👥 Roles and Permissions

Role	Permissions
User	Browse, buy, manage cart & profile
Admin	Manage users, products, orders


⸻

🧪 Test Credentials
	•	Admin
	•	Email: admin@example.com
	•	Password: admin123
	•	User
	•	Email: user@example.com
	•	Password: user123

⸻

📁 Project Structure

backend/
  ├── controllers/
  ├── routes/
  ├── middleware/
  ├── models/
  └── utils/

frontend/
  ├── src/
      ├── components/
      ├── pages/
      ├── context/
      └── api/


⸻

🧹 To-Do Checklist
	•	Input validation (all routes)
	•	Checkout transaction wrapping
	•	Postman collection
	•	Basic backend tests
	•	Form validation
	•	Error handling & feedback
	•	.env.example file
	•	Security & rate limiting

⸻

📄 License

MIT

⸻

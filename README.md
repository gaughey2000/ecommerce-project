# 🛒 PERN E-commerce App

Full-stack e-commerce built with **PostgreSQL**, **Express.js**, **React (Vite)**, and **Node.js**.  
Includes JWT + Google OAuth authentication, admin dashboard, secure image uploads, Swagger docs, and Stripe Checkout with webhooks.

---

## ✨ Features
- 🔐 JWT + Google OAuth authentication
- 🛍️ Products with stock control & variants (size/colour)
- 🛠️ Admin dashboard (CRUD users/products/orders)
- 🛒 Stripe Checkout + webhook confirmation
- 🖼️ Secure image uploads (2MB; JPG/PNG/WebP)
- 📄 Swagger UI at `/api/docs`
- 🧼 Global error handling & role-based access

---

## 🧱 Prerequisites
- Node.js v18+
- PostgreSQL
- npm or Yarn
- Stripe CLI (for local webhooks)

---

## 🔧 Environment Variables
Create the following files from the provided examples.

### `backend/.env`
```env
# DATABASE CONFIG
PGHOST=localhost
PGPORT=5432
PGUSER=your_pg_user
PGPASSWORD=your_pg_password
PGDATABASE=ecommerce

# JWT
JWT_SECRET=your_super_secret_key

# GOOGLE OAUTH
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# FRONTEND ORIGIN
CORS_ORIGIN=http://localhost:5173

# APP PORT
PORT=3000

# STRIPE
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # filled after running `stripe listen`
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## ⚙️ Setup & Run (Local, start to finish)

### 1️⃣ Clone and install dependencies
```bash
git clone https://github.com/yourusername/ecommerce.git
cd ecommerce
```

**Backend**
```bash
cd backend
cp .env.example .env
npm install
```

**Frontend**
```bash
cd ../frontend
cp .env.example .env
npm install
```

---

### 2️⃣ Setup PostgreSQL
```sql
CREATE DATABASE ecommerce;
```
Run your schema/migrations if applicable.

---

### 3️⃣ Start backend & frontend
**Backend**
```bash
cd backend
npm run dev
```
**Frontend**
```bash
cd ../frontend
npm run dev
```
Frontend will usually run on [http://localhost:5173](http://localhost:5173).

---

### 4️⃣ Stripe Webhook (local testing)
In a separate terminal:
```bash
stripe listen --forward-to localhost:3000/api/checkout/webhook
```
Copy the `whsec_...` from Stripe CLI output into your `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 💳 Test a Payment (Stripe)
Use the following Stripe test card details in checkout:
```
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any
```

---

## 🔑 Test Accounts
After running the seed script, you can log in with:

- User: `alice@example.com` / `password123`
- User: `bob@example.com` / `password456`
- Admin: `admin@example.com` / `adminpassword`

---

## 📚 API Documentation
Once backend is running, view Swagger UI at:  
[http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## 🔌 Useful API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/auth/register` | Register user |
| POST   | `/api/auth/login` | Login |
| GET    | `/api/products` | Get all products |
| POST   | `/api/cart` | Add to cart |
| POST   | `/api/checkout/create-checkout-session` | Create Stripe Checkout |
| GET    | `/api/orders` | Get user orders |
| GET    | `/api/orders/by-session/:sessionId` | Get order by Stripe session |

---

## 🧰 Troubleshooting
- **CORS errors** → Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL.
- **Stripe webhook not triggering** → Make sure Stripe CLI is running and forwarding.
- **Images not loading** → Check `/uploads` path and file extensions match allowed list.

---

## 🚀 Deploy (Render example)
- Create two services:  
  1. **Backend** → Node service using `/backend`  
  2. **Frontend** → Static site using `/frontend/dist`
- Set `CORS_ORIGIN` in backend env to your deployed frontend URL.
- Add Stripe keys in Render env settings.

---

## 📁 Project Structure
```
ecommerce/
├── backend/
│   ├── app.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── uploads/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```
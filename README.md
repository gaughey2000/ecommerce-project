# 🛒 PERN E-commerce App

A full-stack e-commerce platform built with **PostgreSQL**, **Express.js**, **React**, and **Node.js**.

### 🧩 Key Features

- 🔐 JWT + Google OAuth authentication
- 🛍️ Product listings with stock control and variant options (size/colour)
- 🛠️ Admin dashboard (CRUD users/products/orders)
- 🛒 Cart and checkout flow with transaction safety
- 🖼️ Secure image uploads (2MB max, JPG/PNG/WebP)
- 🧪 Backend tests with Jest & Supertest
- 📬 Toast notifications and frontend validation
- 🧼 Global error handling and skeleton loaders
- 🔒 Role-based access (User / Admin)

---

## 🚀 Getting Started

### 🧱 Prerequisites

- Node.js v18+
- PostgreSQL installed locally
- Yarn or npm

---

## 🖥️ Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
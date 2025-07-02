E-Commerce Platform

A full-stack e-commerce application featuring user authentication, product listing & management, shopping cart, checkout flow, order history, and an admin dashboard. It’s built with a RESTful Node.js/Express API, PostgreSQL database, and a React + Vite frontend.

⚙️ Setup
	1.	Clone the repo

git clone https://github.com/yourusername/e-commerce.git
cd e-commerce


	2.	Environment Variables
Create a .env file in the root and add:

# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
JWT_SECRET=your_jwt_secret
PORT=5000

# Frontend
VITE_API_URL=http://localhost:5000/api


	3.	Database Setup
Make sure PostgreSQL is running, then:

# Create database
psql -U postgres -c "CREATE DATABASE ecommerce;"

# Apply schema and seed data
psql -U postgres -d ecommerce -f backend/schema.sql
psql -U postgres -d ecommerce -f backend/seed.sql


	4.	Install Dependencies & Run

# Backend
cd backend
npm install
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev


	5.	Access the App
Open your browser at http://localhost:3000.

🛠️ Tech Stack
	•	Backend: Node.js, Express, PostgreSQL
	•	Frontend: React, Vite
	•	Authentication: JWT, bcrypt
	•	File Uploads: Multer
	•	Validation: express-validator

📄 License

This project is licensed under the MIT License.
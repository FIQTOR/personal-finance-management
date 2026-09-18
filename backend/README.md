# Authentication Module - Backend API

A Node.js & Express.js backend module providing comprehensive authentication services (JWT, Cookie Sessions, Google OAuth 2.0, Email Password Reset, and User Management).

---

## 🛠️ Tech Stack

* **Framework:** Express.js (Node.js)
* **Database & ORM:** MySQL / MariaDB via Sequelize ORM (`mysql2`)
* **Authentication:** JWT (`jsonwebtoken`), Cookie Parser & Sessions (`cookie-parser`, `express-session`), OAuth 2.0 (`passport`, `passport-google-oauth20`)
* **Security:** Password Hashing (`bcryptjs`), Crypto (`crypto`)
* **Utilities:** File Upload (`multer`), Mailer (`nodemailer`, `googleapis`)
* **Dev Tools:** Nodemon, Sequelize CLI

---

## 📁 Folder Structure

```text
backend/
├── config/          # Database & environment configurations
├── controllers/     # Controller handling HTTP Requests & Responses
├── middlewares/     # Authentication, authorization, & validation middleware
├── migrations/      # Sequelize CLI database schema migrations
├── models/          # Sequelize table schema & model definitions
├── seeders/         # Sequelize CLI initial database seeders
├── services/        # Business logic (Email, OAuth, Token Management)
├── views/           # Server-side views/templates (optional/email templates)
├── index.js         # Server entry point
└── routes.js        # Global API route definitions
```

---

## ⚙️ Setup & Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables (`.env`):**
   Create a `.env` file in the `backend/` directory based on your required environment setup:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=auth_db
   DB_DIALECT=mysql

   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret_key

   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Database Migrations & Seeders:**
   ```bash
   # Run database migrations
   npx sequelize-cli db:migrate

   # Run initial database seeders
   npx sequelize-cli db:seed:all
   ```

---

## 🚀 Scripts & Commands

* **Start Local Server (Development):**
  ```bash
  npm run dev
  ```
* **Run Database Migrations:**
  ```bash
  npx sequelize-cli db:migrate
  ```
* **Undo Database Migrations:**
  ```bash
  npx sequelize-cli db:migrate:undo
  ```
* **Run Database Seeders:**
  ```bash
  npx sequelize-cli db:seed:all
  ```

---

## 📡 Standard API Response Pattern

* **Success Response:**
  ```json
  {
    "success": true,
    "message": "Descriptive message",
    "data": { ... }
  }
  ```
* **Error Response:**
  ```json
  {
    "success": false,
    "message": "Error description message",
    "errors": [ ... ]
  }
  ```

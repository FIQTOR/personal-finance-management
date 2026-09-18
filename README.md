# 💰 Personal Finance Management Module

A production-ready, full-stack Personal Finance Management module built with **Express.js (Sequelize ORM)** and **React 19 (TypeScript + Vite)**, featuring strict MVC modularity, multi-currency support, budget tracking, financial goals, and Excel exporting.

---

## 🌟 Key Features

- 💵 **Multi-Currency Transactions**: Create, edit, filter, and track transactions with support for multiple currencies (USD, IDR, EUR, GBP).
- 🏷️ **Category Management**: Group transactions into custom income and expense categories with custom colors and icons.
- 📊 **Budget Manager**: Set category spending limits for specific date ranges with real-time visual progress and overflow alerts.
- 🎯 **Financial Goals**: Track progress towards savings targets with progress bars and milestone indicators.
- 📥 **Excel Export**: Server-side Excel generation (`GET /api/transactions/export`) using `xlsx` with date, category, and currency filters.
- 🔑 **Integrated Authentication**: Seamless integration with JWT/User model middleware.
- 🎨 **Modern Responsive UI**: Built with React 19, Redux Toolkit, Tailwind CSS v4, Lucide React, and Framer Motion.

---

## 🏗️ Architecture & Tech Stack

### 🟢 Backend (`/backend`)
- **Framework & ORM**: Express.js & Sequelize ORM (MySQL/MariaDB)
- **Modularity**: Strict `Model -> Controller -> Service -> Route` separation
- **Data Export**: `xlsx` library for server-side `.xlsx` spreadsheet generation
- **API Response Standard**: `{ "success": true, "message": "...", "data": {} }`

### 🔵 Frontend (`/frontend`)
- **Framework & Tooling**: React 19, TypeScript, Vite
- **State Management**: Redux Toolkit (`financeSlice.ts`) & React Hooks
- **Styling & UI**: Tailwind CSS v4, Lucide React, Framer Motion
- **Types**: Strict TypeScript DTO definitions in `src/types/finance.ts`

---

## 🚀 API Endpoints

### 🏷️ Categories (`/api/categories`)
- `GET /api/categories` - List user categories
- `POST /api/categories` - Create new category
- `GET /api/categories/:id` - Get category detail
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### 💳 Transactions (`/api/transactions`)
- `GET /api/transactions` - List transactions (filters: category, currency, type, start_date, end_date)
- `GET /api/transactions/export` - Export filtered transaction history to Excel (`.xlsx`)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction detail
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### 📊 Budgets (`/api/budgets`)
- `GET /api/budgets` - List category budget limits
- `POST /api/budgets` - Create budget limit
- `PUT /api/budgets/:id` - Update budget limit
- `DELETE /api/budgets/:id` - Delete budget limit

### 🎯 Financial Goals (`/api/goals`)
- `GET /api/goals` - List savings goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal progress/target
- `DELETE /api/goals/:id` - Delete goal

---

## 💻 Quick Start

### 1. Backend Setup & Migrations
```bash
cd backend
npm install
npx sequelize-cli db:migrate
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 License
Distributed under the MIT License. Developed by **[IARTY](https://iarty.id)** (support@iarty.id).

# Authentication Module - Frontend UI

A modern React 19 + TypeScript user interface (UI) for the authentication module, equipped with Redux Toolkit for global state management, Tailwind CSS v4 for styling, and Framer Motion for micro-animations.

---

## 🛠️ Tech Stack

* **Core Framework:** React 19 + TypeScript (Vite Bundler)
* **Routing:** React Router v7 (`react-router-dom`)
* **State Management:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) & React Context API
* **Styling & Icons:** Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion, Lucide React icons
* **Data Fetching & Utilities:** Axios (`axios`), `jwt-decode`, `date-fns`, `xlsx`
* **Code Quality:** ESLint, TypeScript Compiler

---

## 📁 Folder Structure

```text
frontend/src/
├── components/     # Reusable UI elements (Button, Input, Modal, Navbar, Footer, etc.)
├── config/         # Global frontend configuration (API BaseURL, App Config)
├── context/        # React Context Providers (Theme, Local AuthContext)
├── data/           # Mock data & static constants
├── hooks/          # Custom React Hooks (e.g., useAuth, useFetch)
├── layouts/        # Master layout components (MainLayout, AuthLayout, DashboardLayout)
├── pages/          # Primary application pages (Login, Register, Dashboard, Profile)
├── store/          # Redux Toolkit store & slices
├── types/          # TypeScript interface & type definitions
└── utils/          # Helper functions (Formatting, Validation, Token storage)
```

---

## ⚙️ Setup & Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables (`.env`):**
   Create a `.env` file in the `frontend/` directory if needed:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

---

## 🚀 Scripts & Commands

* **Start Dev Server (Vite):**
  ```bash
  npm run dev
  ```
* **Build for Production:**
  ```bash
  npm run build
  ```
* **Preview Production Build:**
  ```bash
  npm run preview
  ```
* **Run Code Linter:**
  ```bash
  npm run lint
  ```

---

## 💻 Coding Standards

* **Strict TypeScript:** Avoid using `any`. All API DTOs and models must align strictly with types in `src/types/`.
* **Modular Components:** Every UI component must be cleanly structured under `src/components/` without using ad-hoc inline styles.

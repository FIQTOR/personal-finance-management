# AGENTS.md - System Architecture & Guidelines

This document provides comprehensive guidelines on the architecture, coding standards, conventions, and operational commands for the **Personal Finance Management** repository.

> The codebase is built on the hardened Authentication Module template: auth/RBAC/security infrastructure is ported and kept in sync, with a personal-finance domain (categories, transactions, budgets, goals, app settings) layered on top.

---

## 1. Tech Stack & Architecture

### 🟢 Backend Architecture (`/backend`)
* **Framework:** Express.js (Node.js ≥18)
* **ORM & Database:** Sequelize ORM with `mysql2` driver (MySQL/MariaDB; Postgres supported via `DB_DIALECT=pg`)
* **Authentication & Authorization:**
  * JWT (`jsonwebtoken`) & Cookie Session (`cookie-parser`, `express-session`)
  * OAuth 2.0 Integration via `passport` & `passport-google-oauth20`
  * Password Hashing via `bcryptjs`
* **File Uploads:** `multer` (avatars uploaded to Google Drive via `googleapis`)
* **Mail Service:** `nodemailer`
* **Spreadsheet Export:** `xlsx` (transaction export)
* **Folder Structure & Key Components:**
  * `config/`: `env.js` (validated env loader), `database.js`, `config.js`.
  * `controllers/`: HTTP request handling & response logic (kept thin). Auth controllers + finance controllers (class-based singletons delegating to services).
  * `middlewares/`: auth (`verifyToken`), authorization (`checkPermission`), validation (`validate`), security headers, rate limiting, logging, error handling (`errorHandler`, `notFound`).
  * `models/`: Sequelize table schema definitions (each with explicit `tableName`); `index.js` is a pure barrel.
  * `migrations/`: Sequelize CLI database schema migration scripts.
  * `routes/`: Route definitions split per domain; `routes.js` re-exports them.
  * `seeders/`: Sequelize CLI initial/dummy database seeders.
  * `services/`: Business services — auth/RBAC (`tokenService`, `authService`, `loginAttemptService`, `activityService`, `mailer`) and finance (`categoryService`, `transactionService`, `budgetService`, `goalService`).
  * `utils/`: Helpers (`AppError`, `asyncHandler`, `response`, `cookies`, `password`, `tokenHash`, `sanitize`, `startupBanner`).
  * `validators/`: Request validation schemas (`object`, `string`, `boolean`, `oneOf`, `number`).
  * `tests/`: Jest unit + supertest smoke tests.
  * `views/`: EJS views (`index.ejs`).
  * `index.js`: Server entry point (wires security middleware → routes → 404 → error handler).

**Key backend conventions:**
- **Env:** all env access goes through `config/env.js` (validated, fail-fast). Never read `process.env` in controllers/services (only `config/env.js` and the `DEBUG_ERRORS` check in `errorHandler.js` may).
- **Errors:** throw `AppError`; wrap async handlers with `utils/asyncHandler`; the central `middlewares/errorHandler.js` formats responses.
- **Responses:** use `utils/response.js` → `success(res, { statusCode, message, data })`.
- **Tokens:** refresh / reset / verification tokens are stored **hashed** (SHA-256). The access token payload is minimal `{ id, role }` — the client fetches the full user object from `GET /api/get-auth-permissions`.
- **User model scope:** `password`, `google_id`, `last_password_change` are excluded by default; auth flows opt in via `User.scope('withSecrets')`.
- **Auth route mounting:** routers that expose mixed public/protected paths (`authRoutes`, `activityRoutes`, `appSettingRoutes`, `financeRoutes` — all mounted at the API root) apply middleware **per-route** (not a blanket `router.use`) so unknown paths fall through to the 404 handler.
- **Finance ownership:** every finance query is scoped by `user_id` at the **service** layer — never trust a client-supplied owner id.

**Finance domain (models → services → routes):**
| Entity | Model (table) | Service | Key fields | Ownership |
|---|---|---|---|---|
| Category | `category` (`categories`) | `categoryService` | `name`, `type` (`income`/`expense`), `icon`, `color` | `user_id` |
| Transaction | `transaction` (`transactions`) | `transactionService` | `category_id`, `amount`, `currency`, `type`, `date`, `notes` | `user_id` |
| Budget | `budget` (`budgets`) | `budgetService` | `category_id`, `limit_amount`, `currency`, `start_date`, `end_date` | `user_id` |
| Goal | `goal` (`goals`) | `goalService` | `name`, `target_amount`, `current_amount`, `currency`, `deadline` | `user_id` |
| AppSetting | `app_setting` (`app_settings`) | `appSettingController` | `key`, `value` (allow-list: `default_currency`, `default_language`) | global |

**Main Dependencies (`backend/package.json`):**
- **Core:** `express`, `dotenv`, `cors`, `cookie-parser`
- **Database & ORM:** `sequelize`, `mysql2` (`sequelize-cli` as devDependency)
- **Auth & Security:** `jsonwebtoken`, `bcryptjs`, `passport`, `passport-google-oauth20`, `express-session`
- **Utilities:** `nodemailer`, `multer`, `googleapis`, `xlsx`
- **Dev Tools:** `nodemon`, `jest`, `supertest`

---

### 🔵 Frontend Architecture (`/frontend`)
* **Core Framework:** React 19 + TypeScript (Vite bundler)
* **Routing:** `react-router-dom` v7 with file-based routes (`vite-plugin-pages`)
* **State Management:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) & React Context API
* **Styling & UI:** Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion, Lucide React / React Icons
* **Data Fetching & Utilities:** Axios (centralised client with single-flight refresh), `jwt-decode`, `date-fns`, `xlsx`, `chart.js`/`react-chartjs-2`, `recharts`
* **Testing:** Vitest + `@testing-library/react`
* **Folder Structure & Key Components (`frontend/src/`):**
  * `components/`: Reusable UI elements + route guards (`AuthMiddleware`, `AdminGuard`, `NotFound`, `Forbidden`, Navbar, Sidebar, etc.). Finance UI lives in `components/finance/`; settings tabs in `components/settings/`.
  * `config/`: `AppConfig`, `Metadata`, `routes.ts` (the **single source of truth** for route access rules), and `panelPermissions.ts` (thin facade over `routes.ts`).
  * `constants/`: `BASE_API_URL`, app constants (`APP_NAME`, `TITLE_SUFFIX`, `TOKEN_REFRESH_SKEW_MS`).
  * `context/`: React Context Providers for lightweight state (Theme, Notification, Language).
  * `hooks/`: Custom React hooks (`useLogin`).
  * `layouts/`: Master layouts (`MainLayout`; `PanelLayout` — wraps panel content in `AdminGuard`).
  * `pages/`: File-based primary pages (`index`, `signin`, `setup`, `forgot-password`, `reset-password`, `verify-email`, `email-verification`, `profile`, `settings`, `panel/**`, `[...all].tsx` = 404).
  * `services/`: `apiClient.ts` (axios + interceptors, single-flight refresh), `authApi.ts` (endpoint wrappers).
  * `store/`: Redux store, `authSlice`, `financeSlice`, `Providers`, `hooks`.
  * `types/`: Shared TypeScript interfaces — `index.ts` (auth: `User`, `Role`, `Permission`, `ApiResponse`, `DecodedToken`) and `finance.ts` (domain DTOs).
  * `utils/`: `currency.ts`; legacy thin re-exports (`axiosJWT`, `fetchJWT`) kept for backwards compatibility.

**Main Dependencies (`frontend/package.json`):**
- **Dependencies:** `react`, `react-dom`, `react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `axios`, `jwt-decode`, `tailwindcss`, `@tailwindcss/vite`, `framer-motion`, `lucide-react`, `chart.js`, `react-chartjs-2`, `recharts`, `react-helmet-async`, `react-image-crop`, `react-to-print`, `date-fns`, `xlsx`, `three`, `gsap`, `mermaid`, `react-markdown`, `plyr-react`
- **DevDependencies:** `typescript`, `vite`, `vite-plugin-pages`, `@vitejs/plugin-react`, `eslint`, `typescript-eslint`, `react-icons`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`

---

## 2. Rules & Conventions

### 🏗️ Modular Architecture Standard
1. **Backend Modular Isolation:**
   * Each primary entity must be cleanly separated across the hierarchy: `Model -> Controller -> Service -> Middleware -> Route`.
   * Heavy business logic must reside within `services/`, avoiding bloated `controllers/`. Finance controllers are thin singletons that delegate to their service.
2. **Frontend Modular Isolation:**
   * UI components must be neatly organized inside sub-folders under `src/components/` (e.g. `finance/`, `settings/`).
   * Global API state management must be synchronized using Redux Toolkit Slices in `src/store/` (`authSlice`, `financeSlice`) or React Context in `src/context/`.

### 💻 Coding Standards & Conventions
1. **Frontend TypeScript Strict Rules:**
   * Implicit or explicit `any` types are strictly forbidden unless absolutely unavoidable. Always declare types in `src/types/`.
   * Frontend interfaces for DTOs/API models must strictly match Sequelize schemas / API backend responses.
2. **Backend API Response Pattern:**
   * All backend API responses must follow a consistent standard format:
     ```json
     {
       "success": true,
       "message": "Descriptive message",
       "data": { ... }
     }
     ```
   * Error Response Pattern (produced by `middlewares/errorHandler.js`):
     ```json
     {
       "success": false,
       "message": "Error description message",
       "data": null,
       "code": "OPTIONAL_MACHINE_CODE",
       "errors": []
     }
     ```
   * Stack traces are **never** returned unless `DEBUG_ERRORS=true`.
3. **Frontend Route Access Rules:**
   * Never hardcode route guards. Add a rule to `ROUTE_RULES` in `src/config/routes.ts` (auth/guest/verified/permission); `AuthMiddleware` and `AdminGuard` read from it.
   * API calls go through `services/apiClient.ts` / `services/authApi.ts` — do not call `axios` directly from pages, and do not duplicate token logic. `utils/axiosJWT.ts` / `utils/fetchJWT.ts` are **legacy re-exports only**; new code imports `apiClient`.
4. **Clean Code & Hygiene:**
   * No dead code, unused variables, or redundant `console.log()` statements in production code.
   * Use `UPPER_SNAKE_CASE` for constants, `PascalCase` for React components/Models, and `camelCase` for functions/variables.

### 🔐 Product Decisions (already resolved — do not regress)
* **Setup-only auth:** self-registration is **disabled**. The first (owner) account is created via `POST /api/setup` (guarded by `User.count() === 0`). `signup.tsx` redirects to `/signin`; there is no `/signup` or `/register` endpoint. Admin user creation is via `panel/users/add` (`manage_users`).
* **Access-token TTL:** env-driven, default **15m** (`ACCESS_TOKEN_TTL`). Do not hardcode short TTLs.
* **Authenticated settings:** `GET /api/settings` requires `VerifyToken`; `PUT /api/settings` requires `VerifyToken` + `manage_users` and only accepts the `ALLOWED_SETTING_KEYS` allow-list.
* **Branding:** kept as-is (no rebrand). Package names / `Metadata.ts` may still reference the original template name.

---

## 3. Commands & Scripts

### 🟢 Backend Commands (`/backend`)
Run the following commands inside the `backend/` directory:

* **Start Local Dev Server:**
  ```bash
  npm run dev          # nodemon
  npm start            # node (production)
  ```
* **Run Tests:**
  ```bash
  npm test             # jest
  ```
* **Database (npm script shortcuts):**
  ```bash
  npm run migrate         # sequelize-cli db:migrate
  npm run migrate:undo    # undo last migration
  npm run migrate:fresh   # undo all + re-migrate
  npm run seed            # run all seeders
  ```

> **Env files:** `config/env.js` loads `.env` (production) or `.env.{NODE_ENV}` with fail-fast validation. Required: `DB_HOST, DB_NAME, DB_USER, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET`. Copy `.env.example` → `.env.development` / `.env.test` before first run. `GOOGLE_CLIENT_ID` is required at boot (Passport strategy).

---

### 🔵 Frontend Commands (`/frontend`)
Run the following commands inside the `frontend/` directory:

* **Start Frontend Dev Server (Vite):**
  ```bash
  npm run dev
  ```
* **Build for Production (type-check + build):**
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
* **Run Tests:**
  ```bash
  npm test             # vitest run
  npm run test:watch   # vitest (watch)
  ```

---

*This `AGENTS.md` file serves as the primary reference for AI Agents and Developers working on this project.*

## 🧹 Code Quality & Formatting Rules
- **No Residual Code:** NEVER leave unused imports, dead variables, or commented-out code blocks in any file.
- **Console Log Hygiene:** Remove all temporary `console.log()` statements before finalizing a task. Only keep structured error logs.
- **Naming Conventions:**
  - Components/Files: `PascalCase` (e.g., `FinanceDashboard.tsx`).
  - Utilities/Variables: `camelCase` (e.g., `formatCurrency.ts`).
  - Constants/Enums: `UPPER_SNAKE_CASE` (e.g., `BASE_API_URL`).

## 📝 API & Type Sync Rules
- **Single Source of Truth:** Whenever you update a backend controller or DB model, immediately update the corresponding TypeScript interface in `frontend/src/types/` (`index.ts` for auth, `finance.ts` for domain).
- **Sync Env Examples:** Whenever a new environment variable is introduced, immediately add its template key to `backend/.env.example` **and** to `backend/config/env.js` (env is validated fail-fast).
- **Migrations First:** Schema changes go through a new `migrations/` file (never rely on `sequelize.sync`). Renumber sequentially after the latest (`202400018`…).

## 🔐 Security Invariants (do not regress)
- **Never** return the `password` hash — the `User` model `defaultScope` excludes it; use `User.scope('withSecrets')` only where a password is actually compared.
- **Never** put PII in the JWT — the payload is `{ id, role }` only. Fetch the user object from `GET /api/get-auth-permissions`.
- **Never** store plaintext secrets: refresh / reset / verification tokens are stored hashed (`utils/tokenHash.js`); `user_sessions.token_hash` stores the hash.
- **Cookies:** `httpOnly` always; `secure`/`domain`/`sameSite` come from `config/env.js` (`utils/cookies.js`), never hardcode a domain.
- **Errors:** do not leak `error.message` / stack traces to clients — throw `AppError` and let the error handler format it.
- **Validation:** every mutating endpoint validates its body via `middlewares/validate.js` + a `validators/schemas.js` schema (`authSchemas`, `userSchemas`, `roleSchemas`, `financeSchemas`).
- **Open redirects:** never use a raw client value as a redirect target — pass it through `utils/sanitize.js` → `safeInternalPath` (used for Google OAuth `state`).
- **Ownership:** finance reads/writes are always scoped by the authenticated `user_id` in the service layer.

## 🧹 Strict Import & Linting Rules
- **No Unused Imports:** ALWAYS run a lint check or remove unused variables/imports (e.g., icons, components) before providing code.
- **Auto-Cleanup:** Strip any imported module that is not explicitly referenced in the JSX/logic.

# AI Agent Guidelines & Token Optimization Rules

You are in **CAVEMAN MODE** (Output Optimization).
- Skip all intros, setups, conversational fluff, and robotic acknowledgments (e.g., "Understood", "Here is the code").
- Never apologize or use pleasantries.
- Do not explain code unless explicitly requested by the user.
- Output direct, working code and ultra-concise text only.
- Keep non-code responses under 20-30 words.

---

## 🧠 Memory & Token Optimization (RTK, Ponytail, Headroom)

- **RTK (Reduce Token Usage / Strict File Filtering):**
  - NEVER read, scan, or index heavy/compiled directories: `node_modules`, `dist`, `build`, `.git`, `.next`, `coverage`.
  - NEVER read binary, lock, or environment files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `.env`, `.log`, `.DS_Store`, or media assets.
  - *Action:* Only read strictly necessary files for the immediate task. If searching, use targeted `grep` or regex tools instead of loading entire files into the context window.

- **Ponytail (Context Compression):**
  - *Trigger:* Execute this after completing a major milestone, a large refactoring, or if the chat exceeds 10-15 interactions.
  - *Action:* Stop and summarize the current progress in exactly 3 ultra-concise bullet points.
  - *Action:* Explicitly ask the user for permission to clear/drop older chat context before proceeding to the next task.

- **Headroom (Context Buffer Management):**
  - *Limit:* Keep a maximum of 2 to 3 files actively loaded in your context memory at any given time.
  - *Action:* Before opening or reading a new large file, explicitly state which unrelated files you are "closing" or dropping from your active context.
  - *Goal:* Prevent context-window overflow, reduce token costs, and prevent AI hallucinations caused by context pollution.

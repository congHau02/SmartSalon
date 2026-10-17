# Issue 05: Frontend Auth Pages (Login/Register), Global Auth Context, Token Storage & Route Guards

Status: resolved

## Description

Implement the authentication and authorization frontend modules adhering to `ui-ux-pro-max`:
1. Modern responsive `/login` page supporting dual-identifier (Username or Phone), password visibility toggle, loading states, and toast notifications.
2. Modern responsive `/register` page for customers with form validation (Vietnamese phone number regex, password strength, username rules).
3. React Auth Context & hooks (`useAuth`) maintaining reactive user state, tokens, roles, and branch assignment.
4. Axios client interceptors supporting automatic token refresh on 401 response and redirecting to `/login` when refresh fails.
5. Navigation Route Guards (`RequireAuth` and `RoleGuard`) protecting internal routes based on user role and session state.

## Tasks

- [x] Create `src/features/auth/AuthContext.jsx` with login, register, logout, and token refresh methods.
- [x] Implement `src/features/auth/LoginPage.jsx` with accessible inputs, validation feedback, and clean brand styling.
- [x] Implement `src/features/auth/RegisterPage.jsx` for customer self-registration.
- [x] Update `src/api/axiosClient.js` with silent refresh token interceptor using `/api/v1/auth/refresh`.
- [x] Create `src/components/auth/RequireAuth.jsx` and `src/components/auth/RoleGuard.jsx`.
- [x] Configure routes in `src/App.jsx` mapping `/login`, `/register`, `/admin/*`, `/unauthorized`.
- [x] Verify clean transitions, redirect preservation (`state.from`), and logout token wipe.

## Comments

- Followed `ui-ux-pro-max` guidelines for modern typography, responsive layout, accessible buttons (>= 44px touch targets), password strength visual bar, and feedback.
- Followed `GLOSSARY.md` domain language rules.
- Fast Refresh and oxlint clean with 0 warnings, 0 errors. All backend and frontend builds PASS.

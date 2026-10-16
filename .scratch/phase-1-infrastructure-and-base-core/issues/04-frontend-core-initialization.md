# 04: Frontend Core Initialization (React 19, Vite 8, Tailwind v4)

**What to build:** A modern, high-performance single page application shell under `frontend/` powered by React 19, Vite 8, Tailwind CSS v4, React Router v7, and TanStack Query v5, with pre-configured API client interceptors.

**Blocked by:** 01: Root Infrastructure & Monorepo Restructuring

**Status:** resolved

- [x] Initialize `frontend/` project using Vite 8 with React 19.
- [x] Configure Tailwind CSS v4 using `@tailwindcss/vite` plugin in `vite.config.js` and `@import "tailwindcss";` in `src/index.css` (no legacy v3 config files).
- [x] Set up `src/lib/queryClient.js` and wrap the application root with `QueryClientProvider` (TanStack Query v5).
- [x] Configure `React Router v7` with placeholder layout boundaries (`AdminLayout`, `PosLayout`, `CustomerLayout`).
- [x] Configure `src/api/axiosClient.js` with `baseURL` (`http://localhost:8080/api/v1`) and Request Interceptor attaching JWT `Authorization: Bearer <token>`.
- [x] Scaffold standard directory architecture: `components/ui/`, `components/layout/`, `features/`, `hooks/`, `lib/`.
- [x] Verify `npm run build` succeeds without warnings or errors.

## Answer

- Scaffolded React 19 + Vite 8 in `./frontend`.
- Configured Tailwind CSS v4 via `@tailwindcss/vite` without legacy config files.
- Wrapped root React tree with TanStack Query v5 `QueryClientProvider`.
- Set up React Router v7 with `AdminLayout`, `PosLayout`, and `CustomerLayout`.
- Created `axiosClient` with base URL and JWT Bearer token request interceptor.
- Created reusable UI components (`Button`, `Badge`, `Card`, `utils.js` with `cn`) adhering to `ui-ux-pro-max` Soft UI evolution recommendations.
- Validated via `npm run build` (built in 845ms with 0 errors).

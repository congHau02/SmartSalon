# 04: Frontend Core Initialization (React 19, Vite 8, Tailwind v4)

**What to build:** A modern, high-performance single page application shell under `frontend/` powered by React 19, Vite 8, Tailwind CSS v4, React Router v7, and TanStack Query v5, with pre-configured API client interceptors.

**Blocked by:** 01: Root Infrastructure & Monorepo Restructuring

**Status:** ready-for-agent

- [ ] Initialize `frontend/` project using Vite 8 with React 19.
- [ ] Configure Tailwind CSS v4 using `@tailwindcss/vite` plugin in `vite.config.js` and `@import "tailwindcss";` in `src/index.css` (no legacy v3 config files).
- [ ] Set up `src/lib/queryClient.js` and wrap the application root with `QueryClientProvider` (TanStack Query v5).
- [ ] Configure `React Router v7` with placeholder layout boundaries (`AdminLayout`, `PosLayout`, `CustomerLayout`).
- [ ] Configure `src/api/axiosClient.js` with `baseURL` (`http://localhost:8080/api/v1`) and Request Interceptor attaching JWT `Authorization: Bearer <token>`.
- [ ] Scaffold standard directory architecture: `components/ui/`, `components/layout/`, `features/`, `hooks/`, `lib/`.
- [ ] Verify `npm run build` succeeds without warnings or errors.

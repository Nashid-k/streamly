<div align="center">

<img src="https://img.shields.io/badge/Streamly-Streaming_Platform-FF6B00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik04IDV2MTRsMTEtN3oiLz48L3N2Zz4=" />

# Streamly

### A modern, full-stack streaming discovery platform

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth+Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![TMDB](https://img.shields.io/badge/TMDB-API-01D277?logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://render.com)

</div>

---

## ✨ What is Streamly?

Streamly is a Netflix-inspired streaming discovery platform that aggregates content from **7 OTT platforms** — Netflix, Prime Video, Hotstar, Apple TV+, Zee5, Sony LIV, and JioCinema — into one beautiful, fast interface.

> Browse, search, watch trailers, track your progress, and manage your personal watchlist — all in one place.

---

## 🗺️ Project Structure

### Repositories

| Repository | Description | Deployed To |
|---|---|---|
| [`streamly-frontend`](https://github.com/Nashid-k/streamly-frontend) | React 19 SPA + Vite | Vercel |
| [`streamly-backend`](https://github.com/Nashid-k/streamly-backend) | NestJS API + Stream Service | Render |

### Frontend Repo (`streamly-frontend`)

```
streamly-frontend/
└── frontend/                ← React 19 SPA (Vite) in streamly-frontend/
    ├── src/
    │   ├── api/             ← fetch() wrappers for backend
    │   ├── components/      ← Reusable UI (MovieCard, AuthModal, Toast…)
    │   ├── context/         ← AuthContext (Firebase Auth + Firestore)
    │   ├── hooks/           ← useAuth, useMyList, useContinueWatching
    │   ├── pages/           ← Route-level pages
    │   └── firebase.js      ← Firebase web SDK init
    └── README.md
```

### Backend Repo (`streamly-backend`)

```
streamly-backend/
├── src/                     ← NestJS API (TypeScript)
│   ├── auth/                ← Firebase ID token verification + Firestore user data
│   ├── movies/              ← TMDB catalog, search, streaming
│   └── firebase/            ← Firebase Admin SDK module
│
└── stream-service/          ← Playwright m3u8 extraction service
    ├── server.js            ← Express server (port 3001)
    └── Dockerfile           ← Render deployment
```

---

## 🏗️ Architecture

```
Browser (React 19 + Vite)
    │
    │  HTTPS / REST (via Vercel proxy)
    ▼
Vercel (Frontend)
    │
    │  /api/* → proxy to Render
    ▼
NestJS API (Render)
    ├── Firebase Admin SDK  ←── verifies ID tokens from browser
    ├── TMDB API            ←── movie metadata + catalog
    └── Firestore           ←── myList, continueWatching per user

Stream Service (Render) ←── Playwright extracts m3u8 URLs from CineSrc
    └── Returns direct HLS streams for native <video> playback

Firebase (Google Cloud)
    ├── Authentication      ←── email/password sign-in
    ├── Firestore           ←── user data storage
    └── Analytics           ←── usage telemetry
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

### 1. Clone the repos

```bash
# Frontend
git clone https://github.com/Nashid-k/streamly-frontend.git

# Backend (separate repo)
git clone https://github.com/Nashid-k/streamly-backend.git
```

### 2. Install dependencies

```bash
# Frontend
cd streamly-frontend/frontend && npm install

# Backend
cd streamly-backend && npm install

# Stream Service
cd streamly-backend/stream-service && npm install
```

### 3. Configure environment variables

```bash
# Frontend
cp streamly-frontend/.env.example streamly-frontend/.env
# → Fill in: VITE_FIREBASE_API_KEY, etc.

# Backend
cp .env.example .env
# → Fill in: TMDB_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
```

### 4. Run locally

```bash
# Backend (http://localhost:4000)
cd streamly-backend && npm run start:dev

# Frontend (http://localhost:5173)
cd streamly-frontend/frontend && npm run dev

# Stream Service (http://localhost:3001) — optional, for direct HLS playback
cd streamly-backend/stream-service && npm start
```

---

## 🔥 Features

| Feature | Detail |
|---|---|
| **7 Platforms** | Netflix, Prime Video, Hotstar, Apple TV+, Zee5, Sony LIV, JioCinema |
| **Firebase Auth** | Email/password sign-up & sign-in |
| **Cloud Sync** | My List & Continue Watching synced to Firestore |
| **Guest Mode** | Full browsing with localStorage fallback (no sign-in required) |
| **Search** | Cross-platform search with actor/director cards |
| **Genres** | Dynamic genre pages per platform |
| **Top 10** | Real-time TMDB popularity-based rankings |
| **Direct HLS** | Native `<video>` playback via Playwright stream extraction |
| **Keyboard Shortcuts** | Full keyboard navigation (`Ctrl+K`, `?`, arrow keys) |
| **Responsive** | Mobile-first with a persistent bottom nav bar |
| **Cinematic UI** | Glass-panel hover cards, Framer Motion animations |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — UI framework
- **Vite 8** — Build tool & dev server
- **TanStack Query v5** — Server state, caching, deduplication
- **Framer Motion** — Animations & transitions
- **React Router v7** — Client-side routing
- **Firebase Web SDK** — Auth & Firestore client
- **HLS.js** — Native HLS video playback
- **Lucide React** — Icon library

### Backend
- **NestJS 10** — TypeScript API framework
- **Firebase Admin SDK v14** — Token verification & Firestore server access
- **TMDB API** — Movie & TV metadata
- **@nestjs/cache-manager** — 4-hour in-memory response cache
- **compression** — Gzip middleware

### Stream Service
- **Express** — Lightweight HTTP server
- **Playwright** — Headless Chromium for m3u8 extraction
- **Docker** — Containerized deployment on Render

---

## 📡 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | **Vercel** | [streamlyvercelin.vercel.app](https://streamlyvercelin.vercel.app) |
| Backend API | **Render** | [streamly-backend-9q7i.onrender.com](https://streamly-backend-9q7i.onrender.com) |
| Stream Service | **Render** | Deploy separately using `stream-service/Dockerfile` |

### Vercel Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `/api` (proxied via vercel.json) |
| `VITE_STREAM_SERVICE_URL` | `https://your-stream-service.onrender.com` |

---

## 📄 Documentation

| Document | Location |
|---|---|
| Frontend setup | [`streamly-frontend/README.md`](streamly-frontend/README.md) |
| Frontend Git guide | [`streamly-frontend/GIT.md`](streamly-frontend/GIT.md) |
| Backend API & setup | [`streamly-backend` repo](https://github.com/Nashid-k/streamly-backend) |

---

## 📜 License

MIT © Nashid-k

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

```
Streamly/                    ← Root monorepo (Git submodules)
├── backend/                 ← NestJS API (TypeScript)
│   ├── src/
│   │   ├── auth/            ← Firebase ID token verification + Firestore user data
│   │   ├── movies/          ← TMDB catalog, search, streaming
│   │   ├── users/           ← Guest-mode profile & watchlist
│   │   ├── firebase/        ← Firebase Admin SDK module
│   │   └── utils/
│   └── README.md
│
├── frontend/                ← React 19 SPA (Vite)
│   ├── src/
│   │   ├── api/             ← fetch() wrappers for backend
│   │   ├── components/      ← Reusable UI (MovieCard, AuthModal, Toast…)
│   │   ├── context/         ← AuthContext (Firebase Auth + Firestore)
│   │   ├── hooks/           ← useAuth, useMyList, useContinueWatching
│   │   ├── pages/           ← Route-level pages
│   │   └── firebase.js      ← Firebase web SDK init
│   └── README.md
│
├── package.json             ← Root scripts (runs both together)
└── README.md                ← You are here
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

### 1. Clone the repo

```bash
git clone --recurse-submodules https://github.com/Nashid-k/streamly-backend.git
# or if already cloned:
git submodule update --init --recursive
```

### 2. Install all dependencies

```bash
npm install               # root
npm install --prefix backend
npm install --prefix frontend
```

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# → Fill in: TMDB_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

# Frontend
cp frontend/.env.example frontend/.env
# → Fill in: VITE_API_URL, VITE_FIREBASE_API_KEY, etc.
```

### 4. Run both servers

```bash
# In one terminal — Backend (http://localhost:4000)
npm run start:backend

# In another terminal — Frontend (http://localhost:5173)
npm run start:frontend
```

---

## 🏗️ Architecture

```
Browser (React 19 + Vite)
    │
    │  HTTPS / REST
    ▼
NestJS API (Render)
    ├── Firebase Admin SDK  ←── verifies ID tokens from browser
    ├── TMDB API            ←── movie metadata + catalog
    └── Firestore           ←── myList, continueWatching per user

Firebase (Google Cloud)
    ├── Authentication      ←── email/password sign-in
    ├── Firestore           ←── user data storage
    └── Analytics           ←── usage telemetry
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
| **Intro Skip** | Auto-detected intro/outro timings |
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
- **Lucide React** — Icon library
- **Oxlint** — Fast linter

### Backend
- **NestJS 10** — TypeScript API framework
- **Firebase Admin SDK v14** — Token verification & Firestore server access
- **TMDB API** — Movie & TV metadata
- **@nestjs/cache-manager** — 4-hour in-memory response cache
- **torrent-stream** — P2P video streaming with byte-range support
- **compression** — Gzip middleware
- **Joi** — Environment variable validation

---

## 🔑 Environment Variables

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for the full variable reference.

---

## 📡 Deployment

| Service | Platform | Trigger |
|---|---|---|
| Frontend | **Vercel** | Push to `frontend/main` |
| Backend | **Render** | Push to `backend/main` |

---

## 📄 Documentation

| Document | Location |
|---|---|
| Backend API & setup | [`backend/README.md`](backend/README.md) |
| Frontend setup & components | [`frontend/README.md`](frontend/README.md) |
| Backend Git guide | [`backend/GIT.md`](backend/GIT.md) |
| Frontend Git guide | [`frontend/GIT.md`](frontend/GIT.md) |

---

## 📜 License

MIT © Nashid-k

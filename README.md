# Nflix catalog

This application is a movie and TV discovery catalog. It does not include an unofficial stream resolver or proxy.

## Configuration

Local development uses two environment files:

1. Copy `backend/.env.example` to `backend/.env`. Set exactly one of `TMDB_READ_TOKEN` or `TMDB_API_KEY`; this file is server-only.
2. Copy `frontend/.env.example` to `frontend/.env.local`. Set `NEXT_PUBLIC_API_URL` to the browser-reachable API URL.
3. Adjust `TMDB_CATALOG_PAGES` and `TMDB_ITEMS_PER_RAIL` in `backend/.env` to control catalog breadth. The backend bounds these values to protect the upstream API.

Never place TMDB credentials in `frontend/.env.local` or prefix them with `NEXT_PUBLIC_`: all such values are included in the browser bundle.

## Deployment

Deploy the frontend and backend as separate services.

- Backend: inject the values in `backend/.env.example` as encrypted service environment variables. Set `FRONTEND_ORIGIN=https://your-frontend.example` (comma-separated for multiple approved origins) and run `npm run start:backend`.
- Frontend: set only `NEXT_PUBLIC_API_URL=https://your-api.example/api` in the frontend build environment, then run `npm run build:frontend` and `npm run start:frontend`.

`NEXT_PUBLIC_API_URL` is evaluated at build time, so rebuild the frontend whenever the API URL changes. Do not rely on a root `.env`: the backend and Next.js frontend load their own environment scopes.

The catalog is populated from paginated TMDB discovery rails and search results. It intentionally has no embedded title list, so it remains current without source changes.

## Playback

Metadata and playback are separate. Set `NEXT_PUBLIC_LICENSED_PLAYBACK_ORIGIN` only if you operate or are licensed to use that HTTPS media origin. The UI does not send users through third-party embed services.

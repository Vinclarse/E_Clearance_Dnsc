# ClearanceDNSC

A responsive student clearance management app built with React and Vite. Students can sign in through the E-Clearance API and access the protected student dashboard.

## Getting started

Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

Available scripts:

- `npm run dev` starts the development server.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` checks the project with ESLint.

## Project structure

```text
.
├── index.html
├── public/
├── src/
│   ├── App.jsx       # Landing page, sign-in, and route handling
│   ├── App.css       # Shared page styles
│   ├── index.css     # Stylesheet entry point
│   ├── components/   # Student dashboard components
│   ├── pages/        # Student dashboard page
│   ├── services/     # API client and authentication
│   ├── styles/       # Dashboard styles
│   └── assets/       # Illustrations, icons, and logos
└── vite.config.js
```

The homepage is served at `/`, sign-in at `/login`, and the authenticated student dashboard at `/dashboard`. Sign-in sends the API's documented `username` and `password` fields to `POST /api/v1/login/`; use the username assigned to the account (an email works only if it is also that account's username). Successful access and refresh tokens are saved for authenticated API requests. Unauthenticated visits to `/dashboard` are redirected to `/login`.

API requests use a same-origin proxy to avoid browser CORS failures: Vite proxies `/api` during local development, and the Vercel rewrite proxies it when deployed on Vercel. For a different deployment host, configure an equivalent proxy or have the API allow that frontend origin in its CORS settings. `VITE_API_BASE_URL` is an optional override; using the API's direct origin requires the API to allow the frontend's origin.

The API client leaves `Content-Type` to Axios so JSON requests are encoded normally and `FormData` uploads receive the browser-generated multipart boundary required by the API.

The student dashboard uses the documented `/me/`, `/student-clearances/my-clearances/`, and `/student-clearance-items/?student_clearance=<id>` endpoints. It follows the clearance-items pagination links so the dashboard shows the complete checklist, not just the first page. It also uses `/notifications/`, `/notifications/mark-all-read/`, `/cloudinary/`, and `/me/update/` for the features shown in the dashboard. Password recovery uses `/password-reset/request/`, `/password-reset/verify/`, and `/password-reset/change/`. Access tokens are refreshed through `/token/refresh/`, and sign-out revokes the refresh token through `/logout/`.

## Google sign-in setup

Google sign-in uses Google's Identity Services to obtain an ID token, then sends it to `POST /api/v1/auth/google/`. To enable the button:

1. Create a Google OAuth **Web application** client ID in Google Cloud Console.
2. Add the local app origin you use (`http://localhost:5173` or `http://127.0.0.1:5173`) and deployed app origin to the OAuth client's authorized JavaScript origins.
3. Configure the E-Clearance API to accept the same client ID.
4. Allow your local and deployed frontend origins in the API's CORS settings.
5. Copy `.env.example` to `.env.local`, set `VITE_GOOGLE_CLIENT_ID` to your client ID, and restart Vite.

The client ID is public browser configuration, not a client secret. Do not put a client secret in a `VITE_` variable. Google sign-in stays disabled until a client ID is configured.

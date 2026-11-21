# ClearanceDNSC

A student clearance app for DNSC, built with React and Vite. Students sign in, see which offices still need to approve them, and track progress until clearance is complete. Clearance officers and administrators have their own pages.

## Run it locally

You need Node.js installed. From this folder:

```sh
npm install
npm run dev
```

Vite prints a local address, usually `http://localhost:5173`. Open that in a browser.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app for development. |
| `npm run build` | Builds the app into `dist/` for deployment. |
| `npm run preview` | Serves that production build on your machine. |
| `npm run lint` | Checks the code with ESLint. |

## Pages

| Address | Who it is for |
| --- | --- |
| `/` | Public homepage. |
| `/login` | Sign-in and password recovery. |
| `/dashboard` | Student clearance dashboard. Requires sign-in. |
| `/signatory` | Clearance officer workspace. Requires sign-in. |
| `/admin` | Administrator portal. Requires sign-in. |

Opening a protected page while signed out sends you to `/login`. After a successful sign-in, the app sends each account to the page that matches its role.

Sign in with the account **username** and password. An email address works only when that email is also the account username.

## What each role can do

**Students** (`/dashboard`) can see their clearance checklist, notifications, and profile. The checklist loads every page of clearance items, so items past the first page still appear. They can also request a password reset from the sign-in page.

**Clearance officers** (`/signatory`) review the clearance items assigned to them.

**Administrators** (`/admin`) can open the executive dashboard, clearance templates, student directory, signatory roles, audit logs, profile, and settings. Those screens still use sample data. They are not wired to the E-Clearance API, and the server does not yet restrict them to administrator accounts. Connect them to real endpoints and enforce permissions before using them with live records.

## Connecting to the API

The app calls the E-Clearance API through a same-origin `/api` proxy. That avoids browser CORS errors.

- While you run `npm run dev`, Vite forwards `/api` to the API.
- On Vercel, a rewrite does the same thing.

If you host the app somewhere else, set up the same kind of proxy, or allow this app's address in the API's CORS settings.

`VITE_API_BASE_URL` in `.env.local` is optional. Leave it empty to keep using the proxy. Pointing it straight at the API only works if that API allows this app's origin.

Copy `.env.example` to `.env.local` when you need local settings. Restart `npm run dev` after you change it.

## Google sign-in

The Google button stays off until a client ID is set. To turn it on:

1. In Google Cloud Console, create an OAuth **Web application** client ID.
2. Add this app's addresses as authorized JavaScript origins. For local work that is `http://localhost:5173` or `http://127.0.0.1:5173`, plus the deployed site address.
3. Configure the E-Clearance API to accept that same client ID.
4. Allow those same frontend addresses in the API's CORS settings.
5. In `.env.local`, set `VITE_GOOGLE_CLIENT_ID` to the client ID, then restart Vite.

The client ID is public. Do not put a Google client secret in any `VITE_` variable. Those values are shipped to the browser.

## Project folders

```text
.
├── index.html
├── public/
├── src/
│   ├── App.jsx          # Homepage, sign-in, and which page to show
│   ├── AdminPortal.jsx  # Administrator portal at /admin
│   ├── pages/           # Student dashboard
│   ├── components/      # Student dashboard pieces
│   ├── admin/           # Administrator screens
│   ├── signatory/       # Clearance officer screens
│   ├── services/        # API calls and sign-in
│   ├── styles/          # Dashboard styles
│   └── assets/          # Images and icons
└── vite.config.js
```

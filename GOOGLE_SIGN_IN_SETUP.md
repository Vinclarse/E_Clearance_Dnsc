# Google sign-in setup

## Current status

The login page uses Google's ID-token sign-in button and sends the ID token to
`POST /api/v1/auth/google/`. A successful response saves the API tokens and
redirects to `/dashboard`.

A Google OAuth client ID has been configured in the ignored `.env.local` file.
Google sign-in still depends on the OAuth client's authorized origins and the
API accepting this client ID.

## Ask the Google Cloud project owner

Ask the owner to either grant you access to the existing Google Cloud project
or create a **Web application** OAuth client ID for this app. For local testing,
the client's authorized JavaScript origin must include:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Do not add a client secret to this frontend. A Google OAuth client ID is public
configuration; a client secret must never be placed in a `VITE_` variable or
committed to the frontend.

## Verify local setup

1. Confirm the OAuth client's authorized JavaScript origins include:

   ```text
   http://localhost:5173
   http://127.0.0.1:5173
   ```

2. Confirm the E-Clearance API accepts this client ID when verifying ID tokens
   and allows the local development origin in its CORS settings.
3. Restart the Vite development server (`npm run dev`) so it loads `.env.local`.
4. Open `http://localhost:5173/login` and test **Continue with Google**.

The project also needs to allow `http://localhost:5173` in the E-Clearance API's
CORS settings, and the API must accept the same Google client ID when verifying
ID tokens. If the Google popup works but the API rejects the token, ask the API
owner to check its Google client ID/audience configuration and share the API
error response.

## When the app is deployed

Add the deployed frontend's exact HTTPS origin to both the Google OAuth client's
authorized JavaScript origins and the API's allowed CORS origins. Do not include
a path such as `/login` in an origin.

## Files and API

- Google client ID setting: ignored `.env.local` (`VITE_GOOGLE_CLIENT_ID`)
- Example environment settings: `.env.example`
- Google sign-in endpoint: `POST /api/v1/auth/google/`
- Google sign-in request body: `{ "token": "<Google ID token>" }`
- Expected successful response: an `access` token and, if provided by the API,
  a `refresh` token

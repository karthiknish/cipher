# Better Auth + Convex setup

Cipher uses [Better Auth](https://better-auth.com) with the [@convex-dev/better-auth](https://labs.convex.dev/better-auth) component. Firebase Auth is no longer the primary login path.

## Convex deployment

- **Production cloud URL:** `https://glorious-trout-382.eu-west-1.convex.cloud`
- **Production HTTP actions (auth):** `https://glorious-trout-382.eu-west-1.convex.site`
- **Dev cloud URL:** `https://canny-porcupine-52.eu-west-1.convex.cloud`

## Local `.env.local`

```bash
NEXT_PUBLIC_CONVEX_URL=https://glorious-trout-382.eu-west-1.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://glorious-trout-382.eu-west-1.convex.site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

## Convex dashboard environment variables

Set these in the [Convex dashboard](https://dashboard.convex.dev) for deployment **`glorious-trout-382`** (production) and optionally `canny-porcupine-52` (dev):

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Web client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Web client secret (never commit) |
| `SITE_URL` | `http://localhost:3000` (dev) or `https://cipher-omega-three.vercel.app` (prod) |

`GOOGLE_CLIENT_ID` is already set on the deployment if you ran the setup command.

## Google Cloud Console

1. APIs & Services → Credentials → your **Web client**.
2. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `https://cipher-omega-three.vercel.app`
3. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
   - `https://cipher-omega-three.vercel.app/api/auth/callback/google`

Better Auth routes through Next.js at `/api/auth/*`, so the primary redirect is the Next.js callback URL.

## Auth flow

- **Sign in / sign up:** `/login` — email/password or Google via Better Auth.
- **API routes:** Client sends `Authorization: Bearer <convex-jwt>` from `authClient.convex.token()`.
- **Admin role:** Email whitelist + `users` table in Convex (`users:ensureUser` on login).

## Commands

```bash
npx convex dev --url https://canny-porcupine-52.eu-west-1.convex.cloud
npm run dev
```

## Data & storage

All app data and file uploads use **Convex** (database + file storage). User IDs are Better Auth subject IDs (`user.uid` in the client). Legacy Firebase UIDs can be remapped with `npm run remap:users:prod` if needed.

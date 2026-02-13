# erp-saas
ERP application with an interactive, user-friendly image workspace.

## Secure Firebase setup (hide API keys from GitHub)
This project now reads Firebase config from environment variables instead of hardcoding secrets.

1. Copy the template:

```bash
cp .env.example .env
```

2. Put your real Firebase values in `.env`.
3. Never commit `.env` (it is ignored by `.gitignore`).

Required variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Run locally
```bash
npm install
npm run dev
```

## Vercel deployment note
If Vercel reports `Could not read .../package.json: Unexpected non-whitespace character after JSON`, ensure your deployment points to the latest commit and trigger a redeploy with **Clear build cache**.

## Quick deploy check
Before deploying, run:

```bash
npm run deploy:doctor
```

This verifies `package.json`, `package-lock.json`, and `vercel.json` are valid JSON and prints your current git commit so you can confirm Vercel is building the same commit.

## Firebase rules (apply once)
This repo includes `firestore.rules` configured for your current app model:
- tenant users can only access their own `tenants/{uid}` data
- `superadmin@yourcompany.com` can read/update tenant root docs

To deploy these rules:

```bash
npm install -g firebase-tools
firebase login
firebase use erp-saas-platform
firebase deploy --only firestore:rules
```

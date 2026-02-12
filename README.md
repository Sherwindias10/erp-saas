# erp-saas
erp application

## Vercel deployment note
If Vercel reports `Could not read .../package.json: Unexpected non-whitespace character after JSON`, ensure your deployment points to the latest commit and trigger a redeploy with **Clear build cache**. This repository enforces LF line endings for JSON manifests via `.gitattributes` to avoid manifest parsing issues across environments.

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

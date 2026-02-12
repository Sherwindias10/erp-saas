# erp-saas
erp application

## Vercel deployment note
If Vercel reports `Could not read .../package.json: Unexpected non-whitespace character after JSON`, ensure your deployment points to the latest commit and trigger a redeploy with **Clear build cache**. This repository enforces LF line endings for JSON manifests via `.gitattributes` to avoid manifest parsing issues across environments.

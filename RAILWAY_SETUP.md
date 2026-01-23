# Railway Configuration Guide

## Environment Variables Setup for API Service

### Overview
This guide explains how to configure environment variables in Railway for the API service to work correctly with CORS and other features.

### Important Notes
- ⚠️ Railway injects environment variables directly - DO NOT include quotes around values in the Railway UI
- ⚠️ The local `.env` files are NOT deployed to Railway (they're in `.gitignore`)
- ⚠️ Turbo monorepo requires proper configuration to pass environment variables through (already configured in `turbo.json`)

---

## Required Environment Variables

Navigate to **Railway Dashboard → API Service → Variables** and set the following:

### Core Configuration
```bash
NODE_ENV=production
PORT=4000
```

### Database
```bash
MONGODB_URL=mongodb://mongo:zneKKZZGKljiJgMcdBsPjGjONizEklFC@interchange.proxy.rlwy.net:25332
MONGODB_DB_NAME=ima
```

### CORS Configuration (CRITICAL)
```bash
# Production frontend URL - HTTPS only for security
ALLOWED_ORIGINS=https://imamonorepo-production.up.railway.app
```

**Important:** 
- Only HTTPS for production security
- If you have multiple domains, separate with commas (no spaces):
  ```bash
  ALLOWED_ORIGINS=https://domain1.com,https://domain2.com
  ```

### AWS S3 - Evidence Bucket
```bash
AWS_REGION=auto
AWS_ACCESS_KEY_ID=tid_rXHnMkDGhsbewpEZQPOFnlZufEkPUypfUhrjqnLpDeVtGVKwAN
AWS_SECRET_ACCESS_KEY=tsec_IDlcNTeDemOAalySpnp5EAt7JfNynYArYmnXgpbdzlCJGMzOFbPkIadsCcJaaGky-DM99P
S3_BUCKET=modular-basketcase-cqsn1k
AWS_S3_ENDPOINT=https://storage.railway.app
```

### AWS S3 - Signatures Bucket
```bash
S3_SIGNATURES_BUCKET=ergonomic-briefcase-t-pnb
S3_SIGNATURES_ENDPOINT=https://storage.railway.app
S3_SIGNATURES_ACCESS_KEY_ID=tid_qBaqnSVvaepJGlCBGhFTxyfBxfUEWpTdFaWPTjxOSKwJMRQvSi
S3_SIGNATURES_SECRET_ACCESS_KEY=tsec_p30U7rsqmlqGPevPWcZqpx9Foeb2ZUX3IWddYftE11OD-b7oYN98+SUhi6p9vSZLTFhOXw
S3_SIGNATURES_REGION=auto
```

---

## Replacing Template References

If you previously had template references like `${{evidence.REGION}}`, replace them with the direct values shown above.

**Before (doesn't work):**
```bash
AWS_REGION="${{evidence.REGION}}"
```

**After (works):**
```bash
AWS_REGION=auto
```

---

## Verification

After setting all variables and deploying, check the Railway logs for:

```
✅ Expected Output:
📄 Environment: Railway production - using injected variables
🔍 Environment Variables Debug:
   NODE_ENV: production
   ALLOWED_ORIGINS: https://imamonorepo-production.up.railway.app
   AWS_REGION: auto
   S3_BUCKET: modular-basketcase-cqsn1k
   MONGODB_URL: ✓ set
✅ CORS enabled for origins: https://imamonorepo-production.up.railway.app
🌍 Environment: production
```

❌ **If you see this, variables are NOT configured correctly:**
```
⚠️  ALLOWED_ORIGINS not set, defaulting to http://localhost:3000
   AWS_REGION: not set
   S3_BUCKET: not set
   Environment: development
```

---

## Testing CORS

### Test 1: Access from Production Frontend
1. Open `https://imamonorepo-production.up.railway.app` in browser
2. Open DevTools → Network tab
3. Make an API request
4. **Expected:** Request succeeds, no CORS errors
5. Check response headers should include:
   ```
   Access-Control-Allow-Origin: https://imamonorepo-production.up.railway.app
   Access-Control-Allow-Credentials: true
   ```

### Test 2: Verify CORS Blocking Works
1. Open any other website (e.g., google.com)
2. Open DevTools Console
3. Run:
   ```javascript
   fetch('https://api-production-e79b.up.railway.app/health')
     .catch(err => console.log('Blocked by CORS:', err))
   ```
4. **Expected:** CORS error - request blocked
5. **This confirms:** CORS security is working correctly

---

## Troubleshooting

### Issue: "ALLOWED_ORIGINS not set"
**Cause:** Turbo is not passing environment variables through

**Solution:** Ensure `turbo.json` has been updated with `passThroughEnv` configuration (already done in this repo)

### Issue: CORS still blocking legitimate requests
**Possible Causes:**
1. Railway variable has quotes around the value (remove them)
2. Wrong domain in ALLOWED_ORIGINS (check URL exactly matches)
3. Frontend is using HTTP instead of HTTPS
4. Variable not saved or deployment not restarted

**Debug Steps:**
1. Check Railway logs for the `🔍 Environment Variables Debug` section
2. Verify `ALLOWED_ORIGINS` shows the correct value
3. Verify frontend URL exactly matches (no trailing slashes, correct protocol)

### Issue: Template references not resolving
**Solution:** Replace template references (`${{service.VAR}}`) with direct values as shown above

---

## Local vs Production

### Local Development
- Uses `apps/api/.env` file
- `NODE_ENV=development`
- CORS allows `http://localhost:3000`
- Loads with message: `📄 Environment: Local development - loaded from .env file`

### Railway Production
- Uses Railway dashboard variables
- `NODE_ENV=production`
- CORS allows production domain(s)
- Loads with message: `📄 Environment: Railway production - using injected variables`

---

## Security Best Practices

1. **HTTPS Only:** Never include `http://` URLs in production ALLOWED_ORIGINS
2. **Specific Origins:** Never use `*` (allow all) in production
3. **Credentials:** Keep `credentials: true` for cookie-based authentication
4. **Environment Separation:** Keep development and production variables separate
5. **Secret Management:** Store sensitive keys only in Railway dashboard, never commit to git

---

## Related Files
- `/turbo.json` - Turbo configuration for environment variable pass-through
- `/apps/api/.env` - Local development environment variables (not deployed)
- `/apps/api/src/index.ts` - Conditional dotenv loading logic
- `.gitignore` - Ensures `.env` files are never committed

---

## Additional Resources
- [Railway Environment Variables](https://docs.railway.app/guides/variables)
- [Turbo Environment Variables](https://turbo.build/repo/docs/crafting-your-repository/using-environment-variables)
- [Hono CORS Middleware](https://hono.dev/middleware/builtin/cors)

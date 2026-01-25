# Cross-Domain Cookie Setup Guide

## Overview

This guide explains how to configure your application for cross-subdomain authentication. The changes made ensure that authentication cookies work properly when your frontend, auth service, and API service are deployed on different subdomains.

## Problem Solved

**Issue:** When deploying services on different subdomains (e.g., `web.railway.app`, `auth.railway.app`, `api.railway.app`), authentication cookies set by the auth service were not accessible to the other services, causing:
- Sessions not persisting after login
- 401/403 errors on authenticated API calls
- Users being logged out on page refresh

**Solution:** Configure cookies with proper domain attributes to enable cross-subdomain sharing while maintaining security.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Cookies with Domain=.railway.app (or .domain.com)    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           │ credentials:       │ credentials:       │
           │ include            │ include            │
           ▼                    ▼                    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │   Web    │         │   Auth   │         │   API    │
    │ Service  │────────▶│ Service  │◀────────│ Service  │
    │          │  Login  │          │ Validate│          │
    └──────────┘         └──────────┘  Cookie └──────────┘
```

---

## Changes Made

### 1. Auth Service (`apps/auth/src/lib/auth.ts`)

**Added:**
- `getCookieDomain()`: Helper function to extract parent domain from base URL
- `getTrustedOrigins()`: Parse trusted origins from `ALLOWED_ORIGINS` env var
- Better Auth `advanced` configuration with cookie attributes and cross-subdomain support

**Features:**
- Uses Better Auth native cookie configuration (`advanced.cookies`)
- Auto-detects cookie domain from `BETTER_AUTH_URL` (e.g., `auth.railway.app` → `.railway.app`)
- Supports manual override via `COOKIE_DOMAIN` environment variable
- Configures SameSite and Secure flags based on HTTPS
- Works for localhost (no domain), Railway subdomains, and custom domains

### 2. Environment Configuration

**Updated files:**
- `apps/auth/.env.example`: Added `COOKIE_DOMAIN`, `NODE_ENV`, and detailed documentation
- `apps/web/.env.example`: Added production deployment notes and examples
- `apps/api/.env.example`: Enhanced CORS and auth service integration docs

---

## Deployment Configuration

### Railway Subdomains Setup

If you're using Railway's default subdomains:

#### Auth Service Environment Variables
```bash
NODE_ENV=production
BETTER_AUTH_URL=https://auth-production-xxxx.up.railway.app
COOKIE_DOMAIN=.railway.app
ALLOWED_ORIGINS=https://web-production-yyyy.up.railway.app,https://api-production-zzzz.up.railway.app
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-min-32-chars
```

#### API Service Environment Variables
```bash
NODE_ENV=production
AUTH_SERVICE_URL=https://auth-production-xxxx.up.railway.app
ALLOWED_ORIGINS=https://web-production-yyyy.up.railway.app
MONGODB_URL=mongodb://...
# ... other API configs
```

#### Web Service Environment Variables
```bash
NEXT_PUBLIC_AUTH_URL=https://auth-production-xxxx.up.railway.app
NEXT_PUBLIC_API_URL=https://api-production-zzzz.up.railway.app
```

---

### Custom Domain Setup

If you're using your own domain (e.g., `domain.com`):

#### Auth Service Environment Variables
```bash
NODE_ENV=production
BETTER_AUTH_URL=https://auth.domain.com
COOKIE_DOMAIN=.domain.com
ALLOWED_ORIGINS=https://domain.com,https://api.domain.com
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-min-32-chars
```

#### API Service Environment Variables
```bash
NODE_ENV=production
AUTH_SERVICE_URL=https://auth.domain.com
ALLOWED_ORIGINS=https://domain.com
MONGODB_URL=mongodb://...
# ... other API configs
```

#### Web Service Environment Variables
```bash
NEXT_PUBLIC_AUTH_URL=https://auth.domain.com
NEXT_PUBLIC_API_URL=https://api.domain.com
```

---

## Cookie Security Settings

The implementation automatically configures cookies based on environment:

| Setting | Development | Production |
|---------|-------------|------------|
| **Domain** | `undefined` (localhost) | `.railway.app` or `.domain.com` |
| **SameSite** | `lax` | `none` |
| **Secure** | `false` | `true` (requires HTTPS) |
| **HttpOnly** | `true` | `true` |

### Why these settings?

- **Domain**: Enables cookie sharing across subdomains
- **SameSite=none**: Required for cross-site requests in production (requires Secure)
- **Secure=true**: Cookies only sent over HTTPS (security best practice)
- **HttpOnly=true**: Prevents JavaScript access (XSS protection)

---

## Testing Checklist

### Local Development
- [ ] Services start without errors
- [ ] Login works at `http://localhost:3000`
- [ ] Session persists on page refresh
- [ ] API calls work with authenticated session
- [ ] Logout works properly

### Production (Railway or Custom Domain)
- [ ] All services deployed and accessible via HTTPS
- [ ] Environment variables set correctly
- [ ] `ALLOWED_ORIGINS` includes frontend URL
- [ ] `COOKIE_DOMAIN` set to parent domain
- [ ] `NODE_ENV=production` in auth service

### Browser Testing
1. Open browser DevTools → Application → Cookies
2. Login to the application
3. Verify cookies appear with:
   - **Domain**: `.railway.app` or `.domain.com` (note the leading dot)
   - **SameSite**: `None`
   - **Secure**: ✓ (checkmark)
   - **HttpOnly**: ✓ (checkmark)
4. Refresh the page - session should persist
5. Navigate to different pages - session should persist
6. Make API calls - should receive data without 401 errors

### Troubleshooting

#### Cookies not being set
- Check that `COOKIE_DOMAIN` is set correctly (with leading dot)
- Verify all services are using HTTPS in production
- Check browser console for security warnings
- Ensure `NODE_ENV=production` is set

#### 401/403 errors on API calls
- Verify `AUTH_SERVICE_URL` in API service matches auth service URL
- Check `ALLOWED_ORIGINS` includes frontend URL in both auth and API services
- Verify cookies are being sent (check Network tab → Headers → Cookie)
- Test auth service directly: `curl https://auth.domain.com/auth/get-session -H "Cookie: better_auth.session_token=..."`

#### Session lost on page refresh
- Verify cookie domain matches parent domain
- Check cookie expiration time
- Ensure SameSite and Secure flags are set correctly
- Verify browser is not blocking third-party cookies

#### Cookies work locally but not in production
- Ensure `NODE_ENV=production` is set
- Verify all URLs use HTTPS (not HTTP)
- Check that `COOKIE_DOMAIN` is set in production
- Confirm `ALLOWED_ORIGINS` uses production URLs (not localhost)

---

## Security Considerations

### CORS Configuration
- Only add trusted origins to `ALLOWED_ORIGINS`
- Never use wildcards (`*`) in production
- Keep the list minimal (only necessary domains)

### Cookie Domain
- Only set to parent domain you control
- Never set to TLD (e.g., `.com`, `.org`)
- Be aware: All subdomains can access these cookies

### HTTPS Requirement
- **Critical**: Production MUST use HTTPS for Secure cookies to work
- Railway provides HTTPS by default
- For custom domains, ensure SSL certificates are configured

### SameSite Policy
- `SameSite=none` allows cross-site requests but requires `Secure=true`
- Consider security implications of cross-site requests
- Monitor for CSRF vulnerabilities

---

## Migration from Existing Deployment

If you already have services deployed without these changes:

### Step 1: Update Code
```bash
git pull  # Get the latest changes
```

### Step 2: Update Auth Service Environment
Add these new variables:
```bash
NODE_ENV=production
COOKIE_DOMAIN=.railway.app  # or .yourdomain.com
```

Ensure existing variables are correct:
```bash
BETTER_AUTH_URL=<your-auth-service-url>
ALLOWED_ORIGINS=<your-web-app-url>,<your-api-url>
```

### Step 3: Redeploy Services
1. Deploy auth service first (critical for cookie changes)
2. Deploy API service (no code changes needed)
3. Deploy web service (no code changes needed)

### Step 4: Test
1. Clear browser cookies for your domain
2. Login again
3. Verify cookies have correct Domain attribute
4. Test session persistence and API calls

### Step 5: Monitor
- Check application logs for errors
- Monitor user login issues
- Verify cookie attributes in production

---

## Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Railway Documentation](https://docs.railway.app/)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Test in browser DevTools to see actual cookie attributes
4. Check application logs for errors
5. Verify CORS configuration in both services

For questions or issues with this setup, contact your development team.

# URL Configuration Update Summary

## Overview

Updated all hardcoded backend URLs in the message-rnd-frontend to use the `process.env.NEXT_PUBLIC_API_URL` environment variable.

## Changes Made

### 1. Updated socket.js

**Before:**

```javascript
const socket = io("http://localhost:5000"); // Replace with your backend URL
```

**After:**

```javascript
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const socket = io(SOCKET_URL);
```

### 2. Updated .env.local

Added comment for clarity:

```bash
# Backend API URL (without /api/v1 for socket, axios adds it internally)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Files Already Using Environment Variables ✅

These files were already properly configured:

1. **lib/axios.ts**

   ```typescript
   const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
   ```

2. **lib/api.ts**

   ```typescript
   const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
   ```

3. **lib/api-service.ts**

   - Uses axios instances which already use the environment variable

4. **All Components**
   - `components/dashboard.tsx` - Uses apiService
   - `components/login-page.tsx` - Uses apiService
   - No hardcoded URLs found

## Environment Variable Structure

```
NEXT_PUBLIC_API_URL=http://localhost:5000
                    └─ Base URL (no /api/v1)
```

### How It's Used:

1. **Socket.IO:** Uses base URL directly

   - `http://localhost:5000` → Socket connection

2. **Axios (API calls):** Adds `/api/v1` internally

   - `http://localhost:5000` → `http://localhost:5000/api/v1/projects`

3. **Legacy API client:** Uses base URL, adds paths manually
   - `http://localhost:5000` → `http://localhost:5000/api/v1/auth/login`

## Verification

### All Static URLs Found and Fixed:

| File               | Status               | Notes                      |
| ------------------ | -------------------- | -------------------------- |
| socket.js          | ✅ Fixed             | Now uses env variable      |
| lib/axios.ts       | ✅ Already using env | No change needed           |
| lib/api.ts         | ✅ Already using env | No change needed           |
| lib/api-service.ts | ✅ Uses axios        | Inherits from axios config |
| components/\*.tsx  | ✅ No hardcoded URLs | Uses API services          |

### Excluded Files (Not Source Code):

- `.next/` directory - Build artifacts (auto-generated)
- `.env` and `.env.local` - Configuration files (expected to have URLs)
- Documentation files - Example URLs (appropriate)

## How to Change Backend URL

### For Development:

1. Edit `.env.local`:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

2. Restart the dev server:
   ```bash
   pnpm run dev
   ```

### For Production:

Set the environment variable in your deployment platform:

**Vercel:**

```
Project Settings → Environment Variables
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**Docker:**

```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://backend:5000
```

## Benefits

✅ **Single Source of Truth** - Change URL in one place (.env.local)
✅ **Environment-Specific** - Different URLs for dev/staging/prod
✅ **No Code Changes** - Update config without touching source code
✅ **Type-Safe** - TypeScript support maintained
✅ **Fallback Values** - Defaults to localhost if env var not set

## Testing

To verify the changes work:

1. **Start backend server:**

   ```bash
   cd backend.bff-business-automation-v2
   pnpm run dev
   ```

2. **Start frontend:**

   ```bash
   cd message-rnd-frontend
   pnpm run dev
   ```

3. **Check console:**

   - No hardcoded URL warnings
   - Socket connects to configured URL
   - API calls use configured URL

4. **Test changing URL:**

   ```bash
   # Edit .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000

   # Restart frontend
   pnpm run dev

   # Verify it tries to connect to port 8000
   ```

## Documentation Created

1. **ENVIRONMENT_CONFIG.md** - Complete guide to environment variables
2. **URL_CONFIGURATION_SUMMARY.md** - This file

## Related Files

- **AUTH_FIX_SUMMARY.md** - Authentication implementation
- **API_INTEGRATION_GUIDE.md** - API usage guide
- **.env.local** - Local environment configuration
- **.env** - Default environment configuration

## Migration Notes

If you have existing code using hardcoded URLs:

### Before:

```typescript
await axios.get("http://localhost:5000/api/v1/projects");
```

### After:

```typescript
import { privateAxios } from "@/lib/axios";
await privateAxios.get("/projects");
```

OR

```typescript
import { apiService } from "@/lib/api-service";
await apiService.project.getProjects();
```

## Troubleshooting

**Environment variable not working?**

1. Check file is named `.env.local` (with dot)
2. Restart Next.js dev server
3. Verify variable starts with `NEXT_PUBLIC_`
4. Check for quotes (use `=value` not `="value"`)

**CORS errors?**

1. Ensure backend allows frontend URL
2. Check `withCredentials: true` in axios config
3. Verify backend CORS middleware configuration

**Socket not connecting?**

1. Check browser console for connection errors
2. Verify backend socket.io server is running
3. Check port matches environment variable
4. Verify no firewall blocking connection

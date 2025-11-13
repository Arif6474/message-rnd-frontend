# Environment Configuration

This document explains the environment variables used in the frontend application.

## Environment Files

The application uses the following environment files:

- `.env` - Default environment variables (committed to git)
- `.env.local` - Local overrides (gitignored, for development)
- `.env.production` - Production environment variables

## Available Environment Variables

### NEXT_PUBLIC_API_URL

**Description:** The base URL of the backend API server.

**Usage:**

- Socket.IO connection
- API requests (axios adds `/api/v1` internally for API calls)

**Default Value:** `http://localhost:5000`

**Examples:**

```bash
# Local Development
NEXT_PUBLIC_API_URL=http://localhost:5000

# Docker Development
NEXT_PUBLIC_API_URL=http://backend:5000

# Production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## How It Works

### Socket.IO Connection

The socket connection uses the base URL directly:

```javascript
// socket.js
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const socket = io(SOCKET_URL);
```

### API Requests

The axios instances add `/api/v1` to the base URL:

```typescript
// lib/axios.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
```

This means:

- Environment variable: `http://localhost:5000`
- Actual API calls: `http://localhost:5000/api/v1/projects`
- Socket connection: `http://localhost:5000`

### Legacy API Client

The old API client (lib/api.ts) uses the base URL without `/api/v1`:

```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
```

## Setup Instructions

### 1. Create .env.local file

Copy the `.env` file to `.env.local`:

```bash
cp .env .env.local
```

### 2. Update the URL

Edit `.env.local` with your backend URL:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Restart the development server

After changing environment variables, restart the Next.js server:

```bash
pnpm run dev
```

## Files Using Environment Variables

### Direct Usage

1. **socket.js** - Socket.IO connection

   ```javascript
   const SOCKET_URL =
     process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
   ```

2. **lib/axios.ts** - Axios instances

   ```typescript
   const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
   ```

3. **lib/api.ts** - Legacy API client
   ```typescript
   const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
   ```

### Indirect Usage

All components using the API services automatically use the environment variable:

- `components/dashboard.tsx` - Uses `apiService` which uses `privateAxios`
- `components/login-page.tsx` - Uses `apiService` which uses `publicAxios`
- Any component using socket.io uses the configured socket instance

## Troubleshooting

### Environment variable not working

1. **Check the file name:** Must be exactly `.env.local` (with the dot)
2. **Restart server:** Always restart after changing env files
3. **Check the prefix:** Must start with `NEXT_PUBLIC_` to be available in browser
4. **No quotes:** Use `NEXT_PUBLIC_API_URL=http://localhost:5000` not `"http://localhost:5000"`

### Different backend ports

If your backend runs on a different port:

```bash
# Backend on port 3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# Backend on port 8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### CORS Issues

If you get CORS errors, ensure your backend allows requests from your frontend URL:

```javascript
// Backend (Express)
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend URL
    credentials: true,
  })
);
```

## Production Deployment

### Vercel

Add environment variable in Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` with your production API URL
3. Redeploy the application

### Docker

Use environment variables in docker-compose.yml:

```yaml
services:
  frontend:
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000
```

Or use an .env file:

```yaml
services:
  frontend:
    env_file:
      - .env.production
```

## Security Notes

1. **NEXT*PUBLIC* prefix** makes variables available in the browser
2. **Never store secrets** with the NEXT*PUBLIC* prefix
3. **Use server-side variables** for sensitive data (without NEXT*PUBLIC*)
4. **Validate URLs** in production to prevent injection attacks

## Example Configurations

### Development (Local Backend)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Development (Docker)

```bash
NEXT_PUBLIC_API_URL=http://backend:5000
```

### Staging

```bash
NEXT_PUBLIC_API_URL=https://api-staging.yourdomain.com
```

### Production

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

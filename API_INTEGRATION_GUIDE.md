# API Integration Guide

This guide explains how to use the axios hooks and API services in the application.

## Overview

The application uses two types of axios instances:

- **Public Axios**: For unauthenticated requests (login, register, etc.)
- **Private Axios**: For authenticated requests (requires access token)

## Files Structure

```
lib/
  ├── axios.ts          # Axios instances with interceptors
  ├── api-service.ts    # API service methods
  └── api.ts            # Legacy API client (can be deprecated)

hooks/
  └── use-api.ts        # Custom React hooks for API calls
```

## Usage

### 1. Using API Service (Recommended)

The simplest way to make API calls:

```typescript
import { apiService } from "@/lib/api-service";

// Login (public endpoint)
const response = await apiService.auth.login({ email, password });

// Get projects (authenticated endpoint)
const projects = await apiService.project.getProjects();

// Get single project
const project = await apiService.project.getProjectById("project-id");

// Create project
const newProject = await apiService.project.createProject({
  name: "New Project",
  description: "Project description",
});

// Update project
const updatedProject = await apiService.project.updateProject("project-id", {
  name: "Updated Name",
});

// Delete project
await apiService.project.deleteProject("project-id");

// Logout
await apiService.auth.logout();
```

### 2. Using Direct Axios Instances

For more control or custom endpoints:

```typescript
import { publicAxios, privateAxios } from "@/lib/axios";

// Public request (no auth required)
const response = await publicAxios.post("/auth/login", {
  email: "user@example.com",
  password: "password123",
});

// Private request (auth required - token automatically attached)
const projects = await privateAxios.get("/projects");

// With query parameters
const filteredProjects = await privateAxios.get("/projects", {
  params: {
    page: 1,
    limit: 10,
    status: "active",
  },
});
```

### 3. Using Custom Hooks

For React components with loading and error states:

```typescript
import { usePrivateApi, usePublicApi } from "@/hooks/use-api";

function MyComponent() {
  // For authenticated requests
  const { data, loading, error, execute } = usePrivateApi("/projects", "GET");

  useEffect(() => {
    execute(); // Fetch data on mount
  }, []);

  // For public requests
  const { execute: login } = usePublicApi("/auth/login", "POST");

  const handleLogin = async () => {
    const result = await login({
      data: { email, password },
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render data */}</div>;
}
```

### 4. Using Request Helpers

For one-off requests without hooks:

```typescript
import { publicRequest, privateRequest } from "@/hooks/use-api";

// Public requests
await publicRequest.post("/auth/login", { email, password });

// Private requests
const projects = await privateRequest.get("/projects");
await privateRequest.post("/projects", { name: "New Project" });
await privateRequest.patch("/projects/123", { name: "Updated" });
await privateRequest.delete("/projects/123");
```

## Features

### Automatic Token Management

- Access tokens are automatically attached to private requests
- Tokens are stored in localStorage
- Tokens are automatically refreshed when they expire

### Automatic Token Refresh

When a request fails with 401 (Unauthorized):

1. The interceptor automatically tries to refresh the token
2. If successful, the original request is retried with the new token
3. If refresh fails, the user is redirected to login

### Error Handling

All API calls return consistent error messages:

```typescript
try {
  await apiService.project.getProjects();
} catch (error) {
  // error.response.data.message contains the error message
  console.error(error.response?.data?.message || error.message);
}
```

### Response Format

All API responses follow this structure:

```typescript
{
  status: 'success' | 'error',
  statusCode: number,
  message?: string,
  data?: any,
  error?: {
    code: string,
    message: string
  }
}
```

## Environment Variables

Set your API base URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Authentication Flow

1. **Login**: User logs in → Access token stored in localStorage
2. **Request**: Private requests automatically include token in Authorization header
3. **Token Expiry**: If token expires, interceptor refreshes it automatically
4. **Refresh Failure**: If refresh fails, user is redirected to login
5. **Logout**: Clear tokens and redirect to login page

## Best Practices

1. **Use API Service** for standard CRUD operations
2. **Use Direct Axios** for custom or complex requests
3. **Use Hooks** in React components for automatic state management
4. **Use Request Helpers** for one-off requests outside components
5. **Handle Errors** gracefully in try-catch blocks
6. **Don't** manually manage access tokens - the interceptors handle it

## Example: Complete Login Flow

```typescript
import { apiService } from "@/lib/api-service";

const LoginComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.auth.login({ email, password });
      // Token is automatically stored
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p>{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
};
```

## Example: Fetch and Display Projects

```typescript
import { useEffect, useState } from "react";
import { apiService } from "@/lib/api-service";

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiService.project.getProjects();
        setProjects(response.projects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  );
};
```

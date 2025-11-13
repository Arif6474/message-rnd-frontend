// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    emailVerified: boolean;
  };
  accessToken: string;
}

interface RegisterRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Get access token from localStorage
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Important for cookies (refreshToken)
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'An error occurred',
          data: undefined,
        };
      }

      return {
        success: true,
        message: data.message,
        data: data.data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined,
      };
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store access token if login successful
    if (response.success && response.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response;
  }

  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store access token if registration successful
    if (response.success && response.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/api/v1/auth/logout', {
      method: 'POST',
    });

    // Clear access token
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');

    return response;
  }

  async getProfile(): Promise<ApiResponse<LoginResponse['user']>> {
    return this.request<LoginResponse['user']>('/api/v1/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const response = await this.request<{ accessToken: string }>('/api/v1/auth/refresh', {
      method: 'POST',
    });

    // Update access token if refresh successful
    if (response.success && response.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response;
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { LoginRequest, LoginResponse, RegisterRequest, ApiResponse };

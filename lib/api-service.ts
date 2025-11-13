import { publicAxios, privateAxios } from './axios';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  emailVerified: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "pending";
  lead: string;
  members: string[];
  createdAt: string;
}

// Auth Service - Uses Public Axios
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await publicAxios.post('/auth/login', credentials);
    const data = response.data.data || response.data;
    
    // Store access token
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    
    return data;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await publicAxios.post('/auth/register', data);
    const responseData = response.data.data || response.data;
    
    // Store access token
    if (responseData.accessToken) {
      localStorage.setItem('accessToken', responseData.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(responseData.user));
    }
    
    return responseData;
  },

  logout: async (): Promise<void> => {
    try {
      await privateAxios.post('/auth/logout');
    } finally {
      // Clear tokens regardless of response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
    }
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await publicAxios.post('/auth/refresh');
    const data = response.data.data || response.data;
    
    // Update access token
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    
    return data;
  },
};

// User Service - Uses Private Axios (requires authentication)
export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await privateAxios.get('/auth/me');
    return response.data.data || response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await privateAxios.patch('/auth/me', data);
    return response.data.data || response.data;
  },
};

// Project Service - Uses Private Axios (requires authentication)
export const projectService = {
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ projects: Project[]; total: number; page: number; limit: number }> => {
    const response = await privateAxios.get('/projects', { params });
    return response.data.data || response.data;
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await privateAxios.get(`/projects/${id}`);
    return response.data.data || response.data;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await privateAxios.post('/projects', data);
    return response.data.data || response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await privateAxios.patch(`/projects/${id}`, data);
    return response.data.data || response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await privateAxios.delete(`/projects/${id}`);
  },
};

// Export all services
export const apiService = {
  auth: authService,
  user: userService,
  project: projectService,
};

export default apiService;

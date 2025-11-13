import { useState, useCallback } from 'react';
import { publicAxios, privateAxios } from '@/lib/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (config?: AxiosRequestConfig) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for making public API requests (no authentication required)
 * @param url - The API endpoint URL
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param initialData - Initial data state
 */
export function usePublicApi<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  initialData: T | null = null
): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (config?: AxiosRequestConfig): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await publicAxios({
          url,
          method,
          ...config,
        });

        const data = response.data.data || response.data;
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const error = err as AxiosError<any>;
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          error.message ||
          'An error occurred';
        
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        return null;
      }
    },
    [url, method]
  );

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return { ...state, execute, reset };
}

/**
 * Custom hook for making private API requests (requires authentication)
 * @param url - The API endpoint URL
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param initialData - Initial data state
 */
export function usePrivateApi<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  initialData: T | null = null
): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (config?: AxiosRequestConfig): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await privateAxios({
          url,
          method,
          ...config,
        });

        const data = response.data.data || response.data;
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const error = err as AxiosError<any>;
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          error.message ||
          'An error occurred';
        
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        return null;
      }
    },
    [url, method]
  );

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return { ...state, execute, reset };
}

// Helper functions for direct API calls without hooks

/**
 * Make a public API request without using hooks
 */
export const publicRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    publicAxios.get<T>(url, config).then((res) => res.data),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    publicAxios.post<T>(url, data, config).then((res) => res.data),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    publicAxios.put<T>(url, data, config).then((res) => res.data),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    publicAxios.patch<T>(url, data, config).then((res) => res.data),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    publicAxios.delete<T>(url, config).then((res) => res.data),
};

/**
 * Make a private API request without using hooks
 */
export const privateRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    privateAxios.get<T>(url, config).then((res) => res.data),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    privateAxios.post<T>(url, data, config).then((res) => res.data),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    privateAxios.put<T>(url, data, config).then((res) => res.data),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    privateAxios.patch<T>(url, data, config).then((res) => res.data),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    privateAxios.delete<T>(url, config).then((res) => res.data),
};

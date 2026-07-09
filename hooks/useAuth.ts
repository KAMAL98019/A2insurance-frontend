'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { useLocationFilterStore } from '../store/location-filter.store';
import apiClient from '../lib/api/axios';
import { LoginPayload, RegisterPayload, ForgotPasswordPayload, ApiResponse, LoginResponse, RegisterResponse } from '../types/auth.types';

export function useAuth() {
  const router = useRouter();
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
  const setSelectedLocationId = useLocationFilterStore((s) => s.setSelectedLocationId);

  const login = async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
    const { access_token, user } = data.data;
    setAuth(user, access_token);
    setSelectedLocationId(null); // reset — let LocationSwitcher pick this account's default fresh
    router.push('/dashboard');
  };

  const register = async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', payload);
    return data.data;
  };

  const forgotPassword = async (payload: ForgotPasswordPayload) => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', payload);
    return data.data;
  };

  const logout = () => {
    clearAuth();
    setSelectedLocationId(null);
    router.push('/login');
  };

  return { login, register, forgotPassword, logout, user, isAuthenticated };
}

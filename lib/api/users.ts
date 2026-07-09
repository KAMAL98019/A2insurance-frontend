import apiClient from './axios';
import type { ApiResponse, AuthUser, UserStatus } from '../../types/auth.types';

export interface CreateSuperAdminPayload {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  locationIds?: number[];
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  locationId: number;
  superAdminId?: number;
}

export const usersApi = {
  listAll: () =>
    apiClient.get<ApiResponse<AuthUser[]>>('/users').then((r) => r.data.data),

  listMine: () =>
    apiClient.get<ApiResponse<AuthUser[]>>('/users/my-admin-users').then((r) => r.data.data),

  createSuperAdmin: (payload: CreateSuperAdminPayload) =>
    apiClient.post<ApiResponse<AuthUser>>('/users/super-admin', payload).then((r) => r.data.data),

  createAdminUser: (payload: CreateAdminUserPayload) =>
    apiClient.post<ApiResponse<AuthUser>>('/users/admin-user', payload).then((r) => r.data.data),

  setStatus: (id: number, status: UserStatus) =>
    apiClient.patch<ApiResponse<AuthUser>>(`/users/${id}/status`, { status }).then((r) => r.data.data),

  resetPassword: (id: number, newPassword: string) =>
    apiClient.patch<ApiResponse<AuthUser>>(`/users/${id}/reset-password`, { newPassword }).then((r) => r.data.data),
};

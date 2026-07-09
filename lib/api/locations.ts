import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';

export interface Location {
  id: number;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationPayload {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
}

export const locationsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Location[]>>('/locations').then((r) => r.data.data),

  create: (payload: CreateLocationPayload) =>
    apiClient.post<ApiResponse<Location>>('/locations', payload).then((r) => r.data.data),

  update: (id: number, payload: Partial<CreateLocationPayload>) =>
    apiClient.put<ApiResponse<Location>>(`/locations/${id}`, payload).then((r) => r.data.data),

  deactivate: (id: number) =>
    apiClient.patch<ApiResponse<Location>>(`/locations/${id}/deactivate`).then((r) => r.data.data),

  activate: (id: number) =>
    apiClient.patch<ApiResponse<Location>>(`/locations/${id}/activate`).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/locations/${id}`).then((r) => r.data.data),

  assignSuperAdmin: (locationId: number, superAdminId: number) =>
    apiClient.post<ApiResponse<unknown>>(`/locations/${locationId}/assign-super-admin/${superAdminId}`).then((r) => r.data.data),
};

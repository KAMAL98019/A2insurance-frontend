import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';

export interface LeadSource {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const leadSourcesApi = {
  getAll: (onlyActive = false) =>
    apiClient.get<ApiResponse<LeadSource[]>>(`/lead-sources${onlyActive ? '?active=true' : ''}`).then((r) => r.data.data),

  create: (payload: { name: string; isActive?: boolean }) =>
    apiClient.post<ApiResponse<LeadSource>>('/lead-sources', payload).then((r) => r.data.data),

  update: (id: number, payload: { name?: string; isActive?: boolean }) =>
    apiClient.put<ApiResponse<LeadSource>>(`/lead-sources/${id}`, payload).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/lead-sources/${id}`).then((r) => r.data.data),
};

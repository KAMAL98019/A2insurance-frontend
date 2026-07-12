import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';

export interface InsuranceCompany {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const insuranceCompaniesApi = {
  getAll: (onlyActive = false) =>
    apiClient.get<ApiResponse<InsuranceCompany[]>>(`/insurance-companies${onlyActive ? '?active=true' : ''}`).then((r) => r.data.data),

  create: (payload: { name: string; isActive?: boolean }) =>
    apiClient.post<ApiResponse<InsuranceCompany>>('/insurance-companies', payload).then((r) => r.data.data),

  update: (id: number, payload: { name?: string; isActive?: boolean }) =>
    apiClient.put<ApiResponse<InsuranceCompany>>(`/insurance-companies/${id}`, payload).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/insurance-companies/${id}`).then((r) => r.data.data),
};

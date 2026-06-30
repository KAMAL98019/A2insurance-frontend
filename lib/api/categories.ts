import apiClient from './axios';
import type { VehicleCategory } from '../../types/vehicle-record.types';
import type { ApiResponse } from '../../types/auth.types';

export const categoriesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<VehicleCategory[]>>('/categories').then((r) => r.data.data),

  create: (name: string) =>
    apiClient.post<ApiResponse<VehicleCategory>>('/categories', { name }).then((r) => r.data.data),

  update: (id: number, name: string) =>
    apiClient.put<ApiResponse<VehicleCategory>>(`/categories/${id}`, { name }).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/categories/${id}`).then((r) => r.data.data),
};

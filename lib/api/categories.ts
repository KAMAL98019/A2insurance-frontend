import apiClient from './axios';
import type { VehicleCategory } from '../../types/vehicle-record.types';
import type { ApiResponse } from '../../types/auth.types';

// The backend still models categories as a parent/child tree, but the UI
// treats them as one flat, selectable list — a parent with children
// contributes its children, a parent with none is selectable itself.
export function flattenCategories(categories: VehicleCategory[]): VehicleCategory[] {
  return categories.flatMap((parent) =>
    parent.children && parent.children.length > 0 ? parent.children : [parent],
  );
}

export const categoriesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<VehicleCategory[]>>('/categories').then((r) => r.data.data),

  create: (name: string, parentId?: number) =>
    apiClient.post<ApiResponse<VehicleCategory>>('/categories', { name, parentId }).then((r) => r.data.data),

  update: (id: number, name: string) =>
    apiClient.put<ApiResponse<VehicleCategory>>(`/categories/${id}`, { name }).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/categories/${id}`).then((r) => r.data.data),
};

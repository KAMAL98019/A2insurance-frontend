import apiClient from './axios';
import type { ApiResponse, ModulePermission } from '../../types/auth.types';

export const permissionsApi = {
  getForUser: (adminUserId: number) =>
    apiClient.get<ApiResponse<ModulePermission[]>>(`/permissions/${adminUserId}`).then((r) => r.data.data),

  setMany: (adminUserId: number, permissions: ModulePermission[]) =>
    apiClient.put<ApiResponse<ModulePermission[]>>(`/permissions/${adminUserId}`, permissions).then((r) => r.data.data),

  cloneFrom: (adminUserId: number, sourceAdminUserId: number) =>
    apiClient.post<ApiResponse<ModulePermission[]>>(`/permissions/${adminUserId}/clone-from/${sourceAdminUserId}`).then((r) => r.data.data),
};

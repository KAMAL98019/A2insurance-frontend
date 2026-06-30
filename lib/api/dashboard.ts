import apiClient from './axios';
import type { DashboardStats } from '../../types/vehicle-record.types';
import type { ApiResponse } from '../../types/auth.types';

export const dashboardApi = {
  getStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats').then((r) => r.data.data),
};

import apiClient from './axios';
import type { DashboardStats } from '../../types/vehicle-record.types';
import type { ApiResponse } from '../../types/auth.types';

export const dashboardApi = {
  getStats: (locationId?: number | null) =>
    apiClient
      .get<ApiResponse<DashboardStats>>('/dashboard/stats', { params: locationId ? { locationId } : undefined })
      .then((r) => r.data.data),
};

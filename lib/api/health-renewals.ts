import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';
import type {
  HealthInsuranceRenewal,
  CreateHealthRenewalPayload,
  UpdateHealthRenewalPayload,
} from '../../types/health-renewal.types';

export const healthRenewalsApi = {
  getAll: (healthInsuranceId?: number) =>
    apiClient
      .get<ApiResponse<HealthInsuranceRenewal[]>>(
        healthInsuranceId
          ? `/health-renewals?healthInsuranceId=${healthInsuranceId}`
          : '/health-renewals',
      )
      .then((r) => r.data.data),

  create: (payload: CreateHealthRenewalPayload) =>
    apiClient
      .post<ApiResponse<HealthInsuranceRenewal>>('/health-renewals', payload)
      .then((r) => r.data.data),

  update: (id: number, payload: UpdateHealthRenewalPayload) =>
    apiClient
      .patch<ApiResponse<HealthInsuranceRenewal>>(`/health-renewals/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/health-renewals/${id}`).then((r) => r.data.data),
};

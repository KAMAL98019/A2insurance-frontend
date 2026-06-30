import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';
import type { VehicleRenewal, CreateRenewalPayload, UpdateRenewalPayload } from '../../types/renewal.types';

export const renewalsApi = {
  getAll: (vehicleRecordId?: number) =>
    apiClient
      .get<ApiResponse<VehicleRenewal[]>>(
        vehicleRecordId ? `/renewals?vehicleRecordId=${vehicleRecordId}` : '/renewals',
      )
      .then((r) => r.data.data),

  create: (payload: CreateRenewalPayload) =>
    apiClient
      .post<ApiResponse<VehicleRenewal>>('/renewals', payload)
      .then((r) => r.data.data),

  update: (id: number, payload: UpdateRenewalPayload) =>
    apiClient
      .patch<ApiResponse<VehicleRenewal>>(`/renewals/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/renewals/${id}`).then((r) => r.data.data),
};

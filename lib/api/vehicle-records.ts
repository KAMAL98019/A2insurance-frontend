import apiClient from './axios';
import type { VehicleRecord, CreateVehicleRecordPayload, UpdateVehicleRecordPayload } from '../../types/vehicle-record.types';
import type { ApiResponse } from '../../types/auth.types';

export const vehicleRecordsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<VehicleRecord[]>>('/vehicle-records').then((r) => r.data.data),

  getOne: (id: number) =>
    apiClient.get<ApiResponse<VehicleRecord>>(`/vehicle-records/${id}`).then((r) => r.data.data),

  create: (payload: CreateVehicleRecordPayload) =>
    apiClient.post<ApiResponse<VehicleRecord>>('/vehicle-records', payload).then((r) => r.data.data),

  update: (id: number, payload: UpdateVehicleRecordPayload) =>
    apiClient.put<ApiResponse<VehicleRecord>>(`/vehicle-records/${id}`, payload).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<VehicleRecord>>(`/vehicle-records/${id}`).then((r) => r.data.data),
};

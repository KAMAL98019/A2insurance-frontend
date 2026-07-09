import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';
import type {
  FireInsuranceRecord, CreateFireInsurancePayload, UpdateFireInsurancePayload,
  FireInsuranceStats, FirePolicyStatus, FireCustomerType,
} from '../../types/fire-insurance.types';

export interface FireInsuranceQuery {
  search?: string;
  policyStatus?: FirePolicyStatus;
  customerType?: FireCustomerType;
  renewalDays?: number;
}

function toParams(q: FireInsuranceQuery): Record<string, string> {
  const p: Record<string, string> = {};
  if (q.search)       p.search       = q.search;
  if (q.policyStatus) p.policyStatus = q.policyStatus;
  if (q.customerType) p.customerType = q.customerType;
  if (q.renewalDays)  p.renewalDays  = String(q.renewalDays);
  return p;
}

export const fireInsuranceApi = {
  getAll: (query: FireInsuranceQuery = {}) =>
    apiClient.get<ApiResponse<FireInsuranceRecord[]>>('/fire-insurance', { params: toParams(query) }).then((r) => r.data.data),

  getOne: (id: number) =>
    apiClient.get<ApiResponse<FireInsuranceRecord>>(`/fire-insurance/${id}`).then((r) => r.data.data),

  create: (payload: CreateFireInsurancePayload) =>
    apiClient.post<ApiResponse<FireInsuranceRecord>>('/fire-insurance', payload).then((r) => r.data.data),

  update: (id: number, payload: UpdateFireInsurancePayload) =>
    apiClient.put<ApiResponse<FireInsuranceRecord>>(`/fire-insurance/${id}`, payload).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<FireInsuranceRecord>>(`/fire-insurance/${id}`).then((r) => r.data.data),

  getStats: () =>
    apiClient.get<ApiResponse<FireInsuranceStats>>('/fire-insurance/stats').then((r) => r.data.data),
};

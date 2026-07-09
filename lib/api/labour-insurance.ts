import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';
import type {
  LabourInsuranceRecord, CreateLabourInsurancePayload, UpdateLabourInsurancePayload,
  LabourInsuranceStats, LabourPolicyStatus, LabourCustomerType,
} from '../../types/labour-insurance.types';

export interface LabourInsuranceQuery {
  search?: string;
  policyStatus?: LabourPolicyStatus;
  customerType?: LabourCustomerType;
  renewalDays?: number;
}

function toParams(q: LabourInsuranceQuery): Record<string, string> {
  const p: Record<string, string> = {};
  if (q.search)       p.search       = q.search;
  if (q.policyStatus) p.policyStatus = q.policyStatus;
  if (q.customerType) p.customerType = q.customerType;
  if (q.renewalDays)  p.renewalDays  = String(q.renewalDays);
  return p;
}

export const labourInsuranceApi = {
  getAll: (query: LabourInsuranceQuery = {}) =>
    apiClient.get<ApiResponse<LabourInsuranceRecord[]>>('/labour-insurance', { params: toParams(query) }).then((r) => r.data.data),

  getOne: (id: number) =>
    apiClient.get<ApiResponse<LabourInsuranceRecord>>(`/labour-insurance/${id}`).then((r) => r.data.data),

  create: (payload: CreateLabourInsurancePayload) =>
    apiClient.post<ApiResponse<LabourInsuranceRecord>>('/labour-insurance', payload).then((r) => r.data.data),

  update: (id: number, payload: UpdateLabourInsurancePayload) =>
    apiClient.put<ApiResponse<LabourInsuranceRecord>>(`/labour-insurance/${id}`, payload).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<LabourInsuranceRecord>>(`/labour-insurance/${id}`).then((r) => r.data.data),

  getStats: () =>
    apiClient.get<ApiResponse<LabourInsuranceStats>>('/labour-insurance/stats').then((r) => r.data.data),
};

import apiClient from './axios';
import type {
  HealthInsuranceRecord,
  CreateHealthInsurancePayload,
  UpdateHealthInsurancePayload,
  HealthInsuranceStats,
  HealthPolicyStatus,
  HealthPolicyType,
  HealthCustomerType,
} from '../../types/health-insurance.types';
import type { ApiResponse } from '../../types/auth.types';

export interface HealthInsuranceQuery {
  search?: string;
  policyStatus?: HealthPolicyStatus;
  policyType?: HealthPolicyType;
  customerType?: HealthCustomerType;
  insuranceCompanyName?: string;
  renewalDays?: number;
  locationId?: number | null;
}

function toParams(q: HealthInsuranceQuery): Record<string, string> {
  const p: Record<string, string> = {};
  if (q.search)               p.search               = q.search;
  if (q.policyStatus)         p.policyStatus         = q.policyStatus;
  if (q.policyType)           p.policyType           = q.policyType;
  if (q.customerType)         p.customerType         = q.customerType;
  if (q.insuranceCompanyName) p.insuranceCompanyName = q.insuranceCompanyName;
  if (q.renewalDays)          p.renewalDays          = String(q.renewalDays);
  if (q.locationId)           p.locationId           = String(q.locationId);
  return p;
}

export const healthInsuranceApi = {
  getAll: (query: HealthInsuranceQuery = {}) =>
    apiClient
      .get<ApiResponse<HealthInsuranceRecord[]>>('/health-insurance', { params: toParams(query) })
      .then((r) => r.data.data),

  getOne: (id: number) =>
    apiClient
      .get<ApiResponse<HealthInsuranceRecord>>(`/health-insurance/${id}`)
      .then((r) => r.data.data),

  create: (payload: CreateHealthInsurancePayload) =>
    apiClient
      .post<ApiResponse<HealthInsuranceRecord>>('/health-insurance', payload)
      .then((r) => r.data.data),

  update: (id: number, payload: UpdateHealthInsurancePayload) =>
    apiClient
      .put<ApiResponse<HealthInsuranceRecord>>(`/health-insurance/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: number) =>
    apiClient
      .delete<ApiResponse<HealthInsuranceRecord>>(`/health-insurance/${id}`)
      .then((r) => r.data.data),

  getStats: () =>
    apiClient
      .get<ApiResponse<HealthInsuranceStats>>('/health-insurance/stats')
      .then((r) => r.data.data),

  getUpcomingRenewals: (days = 30) =>
    apiClient
      .get<ApiResponse<HealthInsuranceRecord[]>>('/health-insurance/upcoming-renewals', { params: { days } })
      .then((r) => r.data.data),

  sendWhatsApp: (id: number, message?: string) =>
    apiClient
      .post<ApiResponse<{ success: boolean; message: string }>>(`/health-insurance/${id}/send-whatsapp`, { message })
      .then((r) => r.data.data),
};

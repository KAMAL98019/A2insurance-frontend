import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';
import type { LabourRenewalStatus } from '../../types/labour-insurance.types';

export interface LabourRenewal {
  id: number;
  labourInsuranceId: number;
  labourInsurance: {
    id: number; policyNumber: string; insuredName: string;
    mobileNumber: string; insuranceCompanyName: string;
    renewalDate: string; policyStatus: string;
  };
  status: LabourRenewalStatus;
  notes: string | null;
  renewedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const labourRenewalsApi = {
  getAll: (labourInsuranceId?: number) =>
    apiClient.get<ApiResponse<LabourRenewal[]>>(
      labourInsuranceId ? `/labour-renewals?labourInsuranceId=${labourInsuranceId}` : '/labour-renewals',
    ).then((r) => r.data.data),

  create: (payload: { labourInsuranceId: number; status?: LabourRenewalStatus; notes?: string }) =>
    apiClient.post<ApiResponse<LabourRenewal>>('/labour-renewals', payload).then((r) => r.data.data),

  update: (id: number, payload: { status?: LabourRenewalStatus; notes?: string }) =>
    apiClient.patch<ApiResponse<LabourRenewal>>(`/labour-renewals/${id}`, payload).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/labour-renewals/${id}`).then((r) => r.data.data),
};

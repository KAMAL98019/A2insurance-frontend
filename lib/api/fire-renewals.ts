import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';
import type { FireRenewalStatus } from '../../types/fire-insurance.types';

export interface FireRenewal {
  id: number;
  fireInsuranceId: number;
  fireInsurance: {
    id: number; policyNumber: string; insuredName: string;
    mobileNumber: string; insuranceCompanyName: string;
    renewalDate: string; policyStatus: string;
  };
  status: FireRenewalStatus;
  notes: string | null;
  renewedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const fireRenewalsApi = {
  getAll: (fireInsuranceId?: number) =>
    apiClient.get<ApiResponse<FireRenewal[]>>(
      fireInsuranceId ? `/fire-renewals?fireInsuranceId=${fireInsuranceId}` : '/fire-renewals',
    ).then((r) => r.data.data),

  create: (payload: { fireInsuranceId: number; status?: FireRenewalStatus; notes?: string }) =>
    apiClient.post<ApiResponse<FireRenewal>>('/fire-renewals', payload).then((r) => r.data.data),

  update: (id: number, payload: { status?: FireRenewalStatus; notes?: string }) =>
    apiClient.patch<ApiResponse<FireRenewal>>(`/fire-renewals/${id}`, payload).then((r) => r.data.data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/fire-renewals/${id}`).then((r) => r.data.data),
};

import type { RenewalStatus } from './renewal.types';

export type { RenewalStatus };

export interface HealthInsuranceRenewal {
  id: number;
  healthInsuranceId: number;
  healthInsurance: {
    id: number;
    policyNumber: string;
    policyHolderName: string;
    mobileNumber: string;
    insuranceCompanyName: string;
    policyType: string;
    renewalDate: string;
    policyStatus: string;
  };
  status: RenewalStatus;
  notes: string | null;
  renewedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthRenewalPayload {
  healthInsuranceId: number;
  status?: RenewalStatus;
  notes?: string;
}

export interface UpdateHealthRenewalPayload {
  status?: RenewalStatus;
  notes?: string;
}

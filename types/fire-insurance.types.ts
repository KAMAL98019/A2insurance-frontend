export type FirePolicyStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL' | 'CANCELLED';
export type FireCustomerType = 'NEW' | 'RENEWAL';

export type FireRenewalStatus =
  | 'CONTACTED' | 'DOCS_COLLECTED' | 'PROCESSING'
  | 'PAYMENT_PENDING' | 'RENEWED' | 'CANCELLED';

export interface EmbeddedFireRenewal {
  id: number;
  status: FireRenewalStatus;
  notes: string | null;
  renewedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FireInsuranceRecord {
  id: number;
  policyNumber: string;
  insuranceCompanyName: string;
  insuredName: string;
  mobileNumber: string;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  businessType: string | null;
  policyStartDate: string;
  policyEndDate: string;
  renewalDate: string;
  policyStatus: FirePolicyStatus;
  sumInsured: string;
  netPremium: string;
  cgst: string | null;
  sgst: string | null;
  stampDuty: string | null;
  totalPremium: string;
  receiptNumber: string | null;
  receiptDate: string | null;
  agentName: string | null;
  agentCode: string | null;
  financierName: string | null;
  customerType: FireCustomerType;
  leadSource: string | null;
  remarks: string | null;
  policyDocument: string | null;
  createdAt: string;
  updatedAt: string;
  renewals: EmbeddedFireRenewal[];
}

export interface CreateFireInsurancePayload {
  policyNumber: string;
  insuranceCompanyName: string;
  insuredName: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  businessType?: string;
  policyStartDate: string;
  policyEndDate: string;
  renewalDate: string;
  policyStatus?: FirePolicyStatus;
  sumInsured: number;
  netPremium?: number;
  cgst?: number;
  sgst?: number;
  stampDuty?: number;
  totalPremium: number;
  receiptNumber?: string;
  receiptDate?: string;
  agentName?: string;
  agentCode?: string;
  financierName?: string;
  customerType?: FireCustomerType;
  leadSource?: string;
  remarks?: string;
  policyDocument?: string;
}

export type UpdateFireInsurancePayload = Partial<CreateFireInsurancePayload>;

export interface FireInsuranceStats {
  total: number;
  active: number;
  expired: number;
  pendingRenewal: number;
  upcoming: number;
}

export const FIRE_STATUS_LABELS: Record<FirePolicyStatus, string> = {
  ACTIVE: 'Active', EXPIRED: 'Expired', PENDING_RENEWAL: 'Pending Renewal', CANCELLED: 'Cancelled',
};

export const FIRE_STATUS_COLORS: Record<FirePolicyStatus, string> = {
  ACTIVE: '#2e7d32', EXPIRED: '#c62828', PENDING_RENEWAL: '#e65100', CANCELLED: '#757575',
};

export type LabourPolicyStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL' | 'CANCELLED';
export type LabourCustomerType = 'NEW' | 'RENEWAL';
export type LabourPolicyType = 'UNNAMED' | 'NAMED';

export type LabourRenewalStatus =
  | 'CONTACTED' | 'DOCS_COLLECTED' | 'PROCESSING'
  | 'PAYMENT_PENDING' | 'RENEWED' | 'CANCELLED';

export interface EmbeddedLabourRenewal {
  id: number;
  status: LabourRenewalStatus;
  notes: string | null;
  renewedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabourInsuranceRecord {
  id: number;
  policyNumber: string;
  insuranceCompanyName: string;
  insuredName: string;
  mobileNumber: string;
  email: string | null;
  address: string | null;
  businessDescription: string | null;
  gstNumber: string | null;
  intermediaryCode: string | null;
  intermediaryName: string | null;
  policyStartDate: string;
  policyEndDate: string;
  renewalDate: string;
  policyStatus: LabourPolicyStatus;
  numberOfEmployees: number | null;
  wagesPerEmployee: string | null;
  totalDeclaredWages: string | null;
  premium: string;
  cgst: string | null;
  sgst: string | null;
  totalPremium: string;
  receiptNumber: string | null;
  receiptDate: string | null;
  labourPolicyType: LabourPolicyType;
  customerType: LabourCustomerType;
  leadSource: string | null;
  remarks: string | null;
  policyDocument: string | null;
  createdAt: string;
  updatedAt: string;
  renewals: EmbeddedLabourRenewal[];
}

export interface CreateLabourInsurancePayload {
  policyNumber: string;
  insuranceCompanyName: string;
  insuredName: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  businessDescription?: string;
  gstNumber?: string;
  intermediaryCode?: string;
  intermediaryName?: string;
  policyStartDate: string;
  policyEndDate: string;
  renewalDate: string;
  policyStatus?: LabourPolicyStatus;
  numberOfEmployees?: number;
  wagesPerEmployee?: number;
  totalDeclaredWages?: number;
  premium: number;
  cgst?: number;
  sgst?: number;
  totalPremium: number;
  receiptNumber?: string;
  receiptDate?: string;
  labourPolicyType?: LabourPolicyType;
  customerType?: LabourCustomerType;
  leadSource?: string;
  remarks?: string;
  policyDocument?: string;
}

export type UpdateLabourInsurancePayload = Partial<CreateLabourInsurancePayload>;

export interface LabourInsuranceStats {
  total: number;
  active: number;
  expired: number;
  pendingRenewal: number;
  upcoming: number;
}

export const LABOUR_STATUS_LABELS: Record<LabourPolicyStatus, string> = {
  ACTIVE: 'Active', EXPIRED: 'Expired', PENDING_RENEWAL: 'Pending Renewal', CANCELLED: 'Cancelled',
};

export const LABOUR_STATUS_COLORS: Record<LabourPolicyStatus, string> = {
  ACTIVE: '#2e7d32', EXPIRED: '#c62828', PENDING_RENEWAL: '#e65100', CANCELLED: '#757575',
};

export const LABOUR_POLICY_TYPE_LABELS: Record<LabourPolicyType, string> = {
  UNNAMED: 'Unnamed', NAMED: 'Named',
};

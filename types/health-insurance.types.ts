export type HealthPolicyType =
  | 'INDIVIDUAL'
  | 'FAMILY_FLOATER'
  | 'SENIOR_CITIZEN'
  | 'GROUP_INSURANCE'
  | 'CRITICAL_ILLNESS';

export type HealthPolicyStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'PENDING_RENEWAL'
  | 'CANCELLED';

export type HealthPaymentMode =
  | 'CASH'
  | 'UPI'
  | 'CARD'
  | 'BANK_TRANSFER';

export type HealthCustomerType = 'NEW' | 'RENEWAL';

export interface HealthFamilyMember {
  id: number;
  healthInsuranceId: number;
  memberName: string;
  relationship: string;
  dateOfBirth: string | null;
  gender: string | null;
  medicalHistory: string | null;
  preExistingDisease: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HealthRenewalStatus =
  | 'CONTACTED' | 'DOCS_COLLECTED' | 'PROCESSING'
  | 'PAYMENT_PENDING' | 'RENEWED' | 'CANCELLED';

export interface EmbeddedHealthRenewal {
  id: number;
  status: HealthRenewalStatus;
  notes: string | null;
  renewedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthInsuranceRecord {
  id: number;
  policyNumber: string;
  insuranceCompanyName: string;
  policyHolderName: string;
  mobileNumber: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  policyType: HealthPolicyType;
  policyStartDate: string;
  policyEndDate: string;
  renewalDate: string;
  policyStatus: HealthPolicyStatus;
  sumInsured: string;        // Decimal returned as string from Prisma
  premiumAmount: string;     // Decimal returned as string from Prisma
  paymentMode: HealthPaymentMode | null;
  customerType: HealthCustomerType;
  leadSource: string | null;
  renewalReminderStatus: string | null;
  remarks: string | null;
  nomineeName: string | null;
  nomineeRelationship: string | null;
  nomineeMobileNumber: string | null;
  policyDocument: string | null;
  idProof: string | null;
  medicalDocument: string | null;
  createdAt: string;
  updatedAt: string;
  familyMembers: HealthFamilyMember[];
  renewals: EmbeddedHealthRenewal[];
}

export interface FamilyMemberPayload {
  memberName: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: string;
  medicalHistory?: string;
  preExistingDisease?: string;
}

export interface CreateHealthInsurancePayload {
  policyNumber: string;
  insuranceCompanyName: string;
  policyHolderName: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  policyType: HealthPolicyType;
  policyStartDate: string;
  policyEndDate: string;
  renewalDate: string;
  policyStatus?: HealthPolicyStatus;
  sumInsured: number;
  premiumAmount: number;
  paymentMode?: HealthPaymentMode;
  customerType?: HealthCustomerType;
  leadSource?: string;
  renewalReminderStatus?: string;
  remarks?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
  nomineeMobileNumber?: string;
  policyDocument?: string;
  idProof?: string;
  medicalDocument?: string;
  familyMembers?: FamilyMemberPayload[];
}

export type UpdateHealthInsurancePayload = Partial<CreateHealthInsurancePayload>;

export interface HealthInsuranceStats {
  total: number;
  active: number;
  expired: number;
  pendingRenewal: number;
  upcomingRenewals: number;
}

export const POLICY_TYPE_LABELS: Record<HealthPolicyType, string> = {
  INDIVIDUAL:       'Individual',
  FAMILY_FLOATER:   'Family Floater',
  SENIOR_CITIZEN:   'Senior Citizen',
  GROUP_INSURANCE:  'Group Insurance',
  CRITICAL_ILLNESS: 'Critical Illness',
};

export const POLICY_STATUS_LABELS: Record<HealthPolicyStatus, string> = {
  ACTIVE:          'Active',
  EXPIRED:         'Expired',
  PENDING_RENEWAL: 'Pending Renewal',
  CANCELLED:       'Cancelled',
};

export const POLICY_STATUS_COLORS: Record<HealthPolicyStatus, string> = {
  ACTIVE:          '#2e7d32',
  EXPIRED:         '#c62828',
  PENDING_RENEWAL: '#e65100',
  CANCELLED:       '#757575',
};

export const PAYMENT_MODE_LABELS: Record<HealthPaymentMode, string> = {
  CASH:          'Cash',
  UPI:           'UPI',
  CARD:          'Card',
  BANK_TRANSFER: 'Bank Transfer',
};

export type Category = string;

export type RenewalStatus =
  | 'CONTACTED'
  | 'DOCS_COLLECTED'
  | 'PROCESSING'
  | 'PAYMENT_PENDING'
  | 'RENEWED'
  | 'CANCELLED';

export interface EmbeddedRenewal {
  id: number;
  status: RenewalStatus;
  notes: string | null;
  renewedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleCategory {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRecord {
  id: number;
  vehicleNumber: string;
  ownerName: string;
  cellNumber: string;
  cellNumberAlt: string | null;
  category: string;
  policyExpiryDate: string;
  insuranceCompany: string;
  rcDocument: string | null;
  insuranceDocument: string | null;
  aadhaarDocument: string | null;
  panDocument: string | null;
  photo: string | null;
  odDocument: string | null;
  tpDocument: string | null;
  createdAt: string;
  updatedAt: string;
  renewals?: EmbeddedRenewal[];
}

export interface CreateVehicleRecordPayload {
  vehicleNumber: string;
  ownerName: string;
  cellNumber: string;
  cellNumberAlt?: string;
  category: string;
  policyExpiryDate: string;
  insuranceCompany: string;
  rcDocument?: string;
  insuranceDocument?: string;
  aadhaarDocument?: string;
  panDocument?: string;
  photo?: string;
  odDocument?: string;
  tpDocument?: string;
}

export type UpdateVehicleRecordPayload = Partial<CreateVehicleRecordPayload>;

export interface ExpiryAlert {
  id: number;
  vehicleNumber: string;
  ownerName: string;
  cellNumber: string;
  category: string;
  policyExpiryDate: string;
  daysUntilExpiry: number;
}

export interface DashboardStats {
  total: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
  expired: number;
  renewedThisMonth: number;
  renewalTracking: {
    total: number;
    inProgress: number;
    renewed: number;
    cancelled: number;
  };
  expiryAlerts: ExpiryAlert[];
  categoryBreakdown: { category: string; count: number }[];
}

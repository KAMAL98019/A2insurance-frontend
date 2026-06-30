import type { VehicleRecord } from './vehicle-record.types';

export type RenewalStatus =
  | 'CONTACTED'
  | 'DOCS_COLLECTED'
  | 'PROCESSING'
  | 'PAYMENT_PENDING'
  | 'RENEWED'
  | 'CANCELLED';

export interface VehicleRenewal {
  id: number;
  vehicleRecordId: number;
  vehicleRecord: VehicleRecord;
  status: RenewalStatus;
  notes: string | null;
  renewedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRenewalPayload {
  vehicleRecordId: number;
  status?: RenewalStatus;
  notes?: string;
}

export interface UpdateRenewalPayload {
  status?: RenewalStatus;
  notes?: string;
}

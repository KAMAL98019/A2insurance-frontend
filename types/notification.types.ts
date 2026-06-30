export type NotificationType = 'EXPIRY_30' | 'EXPIRY_15' | 'EXPIRY_7' | 'EXPIRY_TODAY' | 'EXPIRED' | 'RENEWED' | 'MANUAL';
export type NotifStatus      = 'SENT' | 'FAILED' | 'PENDING';

export interface NotificationSettings {
  id: number;
  firstAlertDays:       number;
  secondAlertDays:      number;
  finalAlertDays:       number;
  schedulerHour:        number;
  enableWhatsApp:       boolean;
  enableEmail:          boolean;
  enableSms:            boolean;
  language:             string;
  contactName:          string | null;
  contactPhone:         string | null;
  contactAddress:       string | null;
  whatsappApiKey:       string | null;
  whatsappApiUrl:       string | null;
  whatsappMessageId:    string;
  whatsappPhoneNumberId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  firstAlertDays?:       number;
  secondAlertDays?:      number;
  finalAlertDays?:       number;
  schedulerHour?:        number;
  enableWhatsApp?:       boolean;
  enableEmail?:          boolean;
  enableSms?:            boolean;
  language?:             string;
  contactName?:          string;
  contactPhone?:         string;
  contactAddress?:       string;
  whatsappApiKey?:       string;
  whatsappApiUrl?:       string;
  whatsappMessageId?:    string;
  whatsappPhoneNumberId?: string;
}

export interface NotificationLog {
  id: number;
  vehicleRecordId: number | null;
  vehicleRecord: { vehicleNumber: string; ownerName: string } | null;
  mobileNumber:     string;
  notificationType: NotificationType;
  message:          string;
  status:           NotifStatus;
  response:         string | null;
  sentAt:           string;
}

export interface NotifStats {
  sent:    number;
  failed:  number;
  pending: number;
  total:   number;
}

export interface SendManualPayload {
  mobileNumber:    string;
  message:         string;
  vehicleRecordId?: number;
}

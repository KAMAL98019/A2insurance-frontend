import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';
import type {
  NotificationSettings, UpdateSettingsPayload,
  NotificationLog, NotifStats, SendManualPayload,
} from '../../types/notification.types';

export const notificationsApi = {
  getSettings: () =>
    apiClient.get<ApiResponse<NotificationSettings>>('/notifications/settings').then((r) => r.data.data),

  updateSettings: (payload: UpdateSettingsPayload) =>
    apiClient.put<ApiResponse<NotificationSettings>>('/notifications/settings', payload).then((r) => r.data.data),

  getLogs: (limit = 100) =>
    apiClient.get<ApiResponse<NotificationLog[]>>(`/notifications/logs?limit=${limit}`).then((r) => r.data.data),

  getStats: () =>
    apiClient.get<ApiResponse<NotifStats>>('/notifications/stats').then((r) => r.data.data),

  sendManual: (payload: SendManualPayload) =>
    apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/notifications/send-manual', payload).then((r) => r.data.data),

  testConnection: (mobileNumber: string) =>
    apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/notifications/test', { mobileNumber }).then((r) => r.data.data),

  getWhatsAppStatus: () =>
    apiClient.get<ApiResponse<{ connected: boolean }>>('/notifications/whatsapp-status').then((r) => r.data.data),

  getWhatsAppQR: () =>
    apiClient.get<ApiResponse<{ qrDataUrl: string | null }>>('/notifications/whatsapp-qr').then((r) => r.data.data),

  refreshWhatsAppQR: () =>
    apiClient.post<ApiResponse<{ message: string }>>('/notifications/whatsapp-refresh', {}).then((r) => r.data.data),
};

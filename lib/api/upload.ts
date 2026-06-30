import apiClient from './axios';
import type { ApiResponse } from '../../types/auth.types';

export type UploadType = 'rc' | 'insurance' | 'aadhaar' | 'pan' | 'photo' | 'od' | 'tp';

export async function uploadDocument(file: File, type: UploadType): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<ApiResponse<{ url: string }>>(`/upload/${type}`, form);
  return data.data.url;
}

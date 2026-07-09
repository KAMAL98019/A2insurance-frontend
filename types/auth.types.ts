export type UserRole = 'MASTER_ADMIN' | 'SUPER_ADMIN' | 'ADMIN_USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export';

export interface ModulePermission {
  id?: number;
  adminUserId?: number;
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  createdById?: number | null;
  superAdminId?: number | null;
  primaryLocationId?: number | null;
  accessibleLocationIds?: number[] | null;
  permissions?: ModulePermission[];
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

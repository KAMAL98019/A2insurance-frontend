import type { AuthUser, PermissionAction } from '../types/auth.types';

const FIELD: Record<PermissionAction, 'canView' | 'canCreate' | 'canUpdate' | 'canDelete' | 'canExport'> = {
  view: 'canView',
  create: 'canCreate',
  update: 'canUpdate',
  delete: 'canDelete',
  export: 'canExport',
};

/**
 * Master Admin and Super Admin always have full access.
 * Admin Users are gated by their per-module permission matrix.
 * Plain function (not a hook) so it can be called freely inside loops/callbacks.
 */
export function canAccessModule(user: AuthUser | null, moduleName: string, action: PermissionAction = 'view'): boolean {
  if (!user) return false;
  if (user.role === 'MASTER_ADMIN' || user.role === 'SUPER_ADMIN') return true;

  const perm = user.permissions?.find((p) => p.moduleName === moduleName);
  if (!perm) return false;
  return Boolean(perm[FIELD[action]]);
}

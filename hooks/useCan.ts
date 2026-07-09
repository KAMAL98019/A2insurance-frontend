'use client';

import { useAuthStore } from '../store/auth.store';
import { canAccessModule } from '../lib/permissions';
import type { PermissionAction } from '../types/auth.types';

export function useCan(moduleName: string, action: PermissionAction = 'view'): boolean {
  const user = useAuthStore((s) => s.user);
  return canAccessModule(user, moduleName, action);
}

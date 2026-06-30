'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '../store/auth.store';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

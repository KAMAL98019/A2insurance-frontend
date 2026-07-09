'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useLocationFilterStore } from '../store/location-filter.store';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLocationFilter = useLocationFilterStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateLocationFilter();
  }, [hydrate, hydrateLocationFilter]);

  return <>{children}</>;
}

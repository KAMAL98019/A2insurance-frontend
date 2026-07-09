'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { locationsApi, type Location } from '../lib/api/locations';

/**
 * Returns the locations the current user may act on. The backend already
 * scopes GET /locations live per actor (Master Admin sees all, others see
 * only their current assignments) — don't re-filter here against
 * user.accessibleLocationIds, which is a snapshot frozen at login time and
 * goes stale the moment a location is granted/revoked mid-session.
 */
export function useAccessibleLocations() {
  const user = useAuthStore((s) => s.user);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    locationsApi.getAll()
      .then((all) => setLocations(all.filter((l) => l.status === 'ACTIVE')))
      .finally(() => setLoading(false));
  }, [user]);

  return { locations, loading };
}

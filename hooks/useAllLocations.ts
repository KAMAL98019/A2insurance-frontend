'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { locationsApi, type Location } from '../lib/api/locations';

/**
 * All locations the actor can see, active or inactive — for display/switching
 * purposes (e.g. reviewing a closed branch's historical data). Use
 * useAccessibleLocations() instead when populating an assignment picker,
 * where only active locations should be selectable for new work.
 */
export function useAllLocations() {
  const user = useAuthStore((s) => s.user);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    locationsApi.getAll()
      .then(setLocations)
      .finally(() => setLoading(false));
  }, [user]);

  return { locations, loading };
}

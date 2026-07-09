import { useEffect, useState } from 'react';
import { leadSourcesApi, LeadSource } from '../lib/api/lead-sources';

export function useLeadSources(onlyActive = true) {
  const [sources,  setSources]  = useState<LeadSource[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    leadSourcesApi.getAll(onlyActive)
      .then(setSources)
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, [onlyActive]);

  return { sources, loading };
}

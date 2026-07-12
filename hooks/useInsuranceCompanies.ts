import { useEffect, useState } from 'react';
import { insuranceCompaniesApi, InsuranceCompany } from '../lib/api/insurance-companies';

export function useInsuranceCompanies(onlyActive = true) {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    insuranceCompaniesApi.getAll(onlyActive)
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [onlyActive]);

  return { companies, loading };
}

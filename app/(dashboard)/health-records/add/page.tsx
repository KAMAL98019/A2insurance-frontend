'use client';

import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import NextLink  from 'next/link';
import { useRouter } from 'next/navigation';
import HealthInsuranceForm    from '../../../../components/health-insurance/HealthInsuranceForm';
import { healthInsuranceApi } from '../../../../lib/api/health-insurance';
import type { HealthInsuranceFormValues } from '../../../../lib/validations/health-insurance.schema';

export default function AddHealthRecordPage() {
  const router = useRouter();

  const handleSubmit = async (values: HealthInsuranceFormValues) => {
    await healthInsuranceApi.create({
      ...values,
      email:      values.email      || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      gender:     values.gender     || undefined,
      address:    values.address    || undefined,
    });
    router.push('/health-records');
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/health-records" underline="hover" color="inherit">
          Health Insurance Records
        </MuiLink>
        <Typography color="text.primary">Add Policy</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Add Health Insurance Policy</Typography>

      <HealthInsuranceForm onSubmit={handleSubmit} submitLabel="Create Policy" />
    </Box>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Alert, Skeleton } from '@mui/material';
import NextLink  from 'next/link';
import { useRouter } from 'next/navigation';
import HealthInsuranceForm    from '../../../../../components/health-insurance/HealthInsuranceForm';
import { healthInsuranceApi } from '../../../../../lib/api/health-insurance';
import { parseApiError }       from '../../../../../lib/parse-error';
import { useToast }            from '../../../../../providers/ToastProvider';
import type { HealthInsuranceRecord } from '../../../../../types/health-insurance.types';
import type { HealthInsuranceFormValues } from '../../../../../lib/validations/health-insurance.schema';

export default function EditHealthRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const { showSuccess } = useToast();

  const [record,  setRecord]  = useState<HealthInsuranceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    healthInsuranceApi.getOne(Number(id))
      .then(setRecord)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: HealthInsuranceFormValues) => {
    await healthInsuranceApi.update(Number(id), {
      ...values,
      email:       values.email       || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      gender:      values.gender      || undefined,
      address:     values.address     || undefined,
    });
    showSuccess('Health insurance record updated.');
    router.push(`/health-records/${id}`);
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={28} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (error || !record) {
    return <Alert severity="error">{error || 'Record not found.'}</Alert>;
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/health-records" underline="hover" color="inherit">
          Health Insurance Records
        </MuiLink>
        <MuiLink component={NextLink} href={`/health-records/${id}`} underline="hover" color="inherit">
          {record.policyNumber}
        </MuiLink>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Edit Health Insurance Policy</Typography>

      <HealthInsuranceForm existing={record} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </Box>
  );
}

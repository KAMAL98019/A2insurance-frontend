'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Alert, Skeleton } from '@mui/material';
import NextLink  from 'next/link';
import { useRouter } from 'next/navigation';
import FireInsuranceForm    from '../../../../../components/fire-insurance/FireInsuranceForm';
import { fireInsuranceApi } from '../../../../../lib/api/fire-insurance';
import { parseApiError }    from '../../../../../lib/parse-error';
import { useToast }         from '../../../../../providers/ToastProvider';
import type { FireInsuranceRecord } from '../../../../../types/fire-insurance.types';
import type { FireInsuranceFormValues } from '../../../../../lib/validations/fire-insurance.schema';

export default function EditFireRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const { showSuccess } = useToast();

  const [record,  setRecord]  = useState<FireInsuranceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fireInsuranceApi.getOne(Number(id))
      .then(setRecord)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: FireInsuranceFormValues) => {
    await fireInsuranceApi.update(Number(id), {
      ...values,
      email:          values.email          || undefined,
      address:        values.address        || undefined,
      gstNumber:      values.gstNumber      || undefined,
      businessType:   values.businessType   || undefined,
      receiptNumber:  values.receiptNumber  || undefined,
      receiptDate:    values.receiptDate    || undefined,
      agentName:      values.agentName      || undefined,
      agentCode:      values.agentCode      || undefined,
      financierName:  values.financierName  || undefined,
      leadSource:     values.leadSource     || undefined,
      remarks:        values.remarks        || undefined,
      policyDocument: values.policyDocument || undefined,
    });
    showSuccess('Fire insurance record updated.');
    router.push(`/fire-records/${id}`);
  };

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={300} height={28} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" height={400} />
    </Box>
  );

  if (error || !record) return <Alert severity="error">{error || 'Record not found.'}</Alert>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/fire-records" underline="hover" color="inherit">
          Fire Insurance Records
        </MuiLink>
        <MuiLink component={NextLink} href={`/fire-records/${id}`} underline="hover" color="inherit">
          {record.policyNumber}
        </MuiLink>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Edit Fire Insurance Policy</Typography>

      <FireInsuranceForm existing={record} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </Box>
  );
}

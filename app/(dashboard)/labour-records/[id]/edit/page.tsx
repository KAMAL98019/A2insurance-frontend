'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Alert, Skeleton } from '@mui/material';
import NextLink  from 'next/link';
import { useRouter } from 'next/navigation';
import LabourInsuranceForm    from '../../../../../components/labour-insurance/LabourInsuranceForm';
import { labourInsuranceApi } from '../../../../../lib/api/labour-insurance';
import { parseApiError }      from '../../../../../lib/parse-error';
import { useToast }           from '../../../../../providers/ToastProvider';
import type { LabourInsuranceRecord } from '../../../../../types/labour-insurance.types';
import type { LabourInsuranceFormValues } from '../../../../../lib/validations/labour-insurance.schema';

export default function EditLabourRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const { showSuccess } = useToast();

  const [record,  setRecord]  = useState<LabourInsuranceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    labourInsuranceApi.getOne(Number(id))
      .then(setRecord)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: LabourInsuranceFormValues) => {
    await labourInsuranceApi.update(Number(id), {
      ...values,
      email:               values.email               || undefined,
      address:             values.address             || undefined,
      businessDescription: values.businessDescription || undefined,
      gstNumber:           values.gstNumber           || undefined,
      intermediaryCode:    values.intermediaryCode    || undefined,
      intermediaryName:    values.intermediaryName    || undefined,
      receiptNumber:       values.receiptNumber       || undefined,
      receiptDate:         values.receiptDate         || undefined,
      leadSource:          values.leadSource          || undefined,
      remarks:             values.remarks             || undefined,
      policyDocument:      values.policyDocument      || undefined,
    });
    showSuccess('Labour insurance record updated.');
    router.push(`/labour-records/${id}`);
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
        <MuiLink component={NextLink} href="/labour-records" underline="hover" color="inherit">
          Labour Insurance Records
        </MuiLink>
        <MuiLink component={NextLink} href={`/labour-records/${id}`} underline="hover" color="inherit">
          {record.policyNumber}
        </MuiLink>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Edit Labour Insurance Policy</Typography>

      <LabourInsuranceForm existing={record} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </Box>
  );
}

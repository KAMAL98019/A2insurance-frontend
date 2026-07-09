'use client';

import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import NextLink  from 'next/link';
import { useRouter } from 'next/navigation';
import LabourInsuranceForm    from '../../../../components/labour-insurance/LabourInsuranceForm';
import { labourInsuranceApi } from '../../../../lib/api/labour-insurance';
import type { LabourInsuranceFormValues } from '../../../../lib/validations/labour-insurance.schema';

export default function AddLabourRecordPage() {
  const router = useRouter();

  const handleSubmit = async (values: LabourInsuranceFormValues) => {
    await labourInsuranceApi.create({
      ...values,
      premium:             values.premium             ?? 0,
      totalPremium:        values.totalPremium        ?? 0,
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
    router.push('/labour-records');
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/labour-records" underline="hover" color="inherit">
          Labour Insurance Records
        </MuiLink>
        <Typography color="text.primary">Add Policy</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Add Labour Insurance Policy</Typography>

      <LabourInsuranceForm onSubmit={handleSubmit} submitLabel="Create Policy" />
    </Box>
  );
}

'use client';

import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import NextLink  from 'next/link';
import { useRouter } from 'next/navigation';
import FireInsuranceForm    from '../../../../components/fire-insurance/FireInsuranceForm';
import { fireInsuranceApi } from '../../../../lib/api/fire-insurance';
import type { FireInsuranceFormValues } from '../../../../lib/validations/fire-insurance.schema';

export default function AddFireRecordPage() {
  const router = useRouter();

  const handleSubmit = async (values: FireInsuranceFormValues) => {
    await fireInsuranceApi.create({
      ...values,
      email:        values.email        || undefined,
      address:      values.address      || undefined,
      gstNumber:    values.gstNumber    || undefined,
      businessType: values.businessType || undefined,
      receiptNumber: values.receiptNumber || undefined,
      receiptDate:  values.receiptDate  || undefined,
      agentName:    values.agentName    || undefined,
      agentCode:    values.agentCode    || undefined,
      financierName: values.financierName || undefined,
      leadSource:   values.leadSource   || undefined,
      remarks:      values.remarks      || undefined,
      policyDocument: values.policyDocument || undefined,
    });
    router.push('/fire-records');
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/fire-records" underline="hover" color="inherit">
          Fire Insurance Records
        </MuiLink>
        <Typography color="text.primary">Add Policy</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Add Fire Insurance Policy</Typography>

      <FireInsuranceForm onSubmit={handleSubmit} submitLabel="Create Policy" />
    </Box>
  );
}

'use client';

import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import VehicleRecordForm from '../../../../components/vehicle-records/VehicleRecordForm';
import { vehicleRecordsApi } from '../../../../lib/api/vehicle-records';
import type { VehicleRecordFormValues } from '../../../../lib/validations/vehicle-record.schema';

export default function AddVehicleRecordPage() {
  const router = useRouter();

  const handleSubmit = async (values: VehicleRecordFormValues) => {
    await vehicleRecordsApi.create(values);
    router.push('/vehicle-records');
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/vehicle-records" underline="hover" color="inherit">
          Vehicle Records
        </MuiLink>
        <Typography color="text.primary">Add Vehicle</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Add Vehicle Record</Typography>

      <VehicleRecordForm onSubmit={handleSubmit} submitLabel="Create Record" enableDraft />
    </Box>
  );
}

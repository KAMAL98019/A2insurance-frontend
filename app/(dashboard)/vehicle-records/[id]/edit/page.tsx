'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Breadcrumbs, Link as MuiLink, CircularProgress, Alert } from '@mui/material';
import NextLink from 'next/link';
import { vehicleRecordsApi } from '../../../../../lib/api/vehicle-records';
import VehicleRecordForm from '../../../../../components/vehicle-records/VehicleRecordForm';
import type { VehicleRecord } from '../../../../../types/vehicle-record.types';
import type { VehicleRecordFormValues } from '../../../../../lib/validations/vehicle-record.schema';

export default function EditVehicleRecordPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [record, setRecord] = useState<VehicleRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehicleRecordsApi.getOne(Number(id)).then(setRecord).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: VehicleRecordFormValues) => {
    await vehicleRecordsApi.update(Number(id), values);
    router.push(`/vehicle-records/${id}`);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (!record)  return <Alert severity="error">Record not found.</Alert>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/vehicle-records" underline="hover" color="inherit">Vehicle Records</MuiLink>
        <MuiLink component={NextLink} href={`/vehicle-records/${id}`} underline="hover" color="inherit">{record.vehicleNumber}</MuiLink>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Edit Vehicle Record</Typography>

      <VehicleRecordForm existing={record} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </Box>
  );
}

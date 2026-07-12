'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Typography, Breadcrumbs, Link as MuiLink, Paper, Grid,
  Chip, Divider, Button, CircularProgress, Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import NextLink from 'next/link';
import dayjs from 'dayjs';
import { vehicleRecordsApi } from '../../../../lib/api/vehicle-records';
import DocumentCell from '../../../../components/vehicle-records/DocumentCell';
import type { VehicleRecord } from '../../../../types/vehicle-record.types';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

export default function VehicleRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<VehicleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    vehicleRecordsApi.getOne(Number(id))
      .then(setRecord)
      .catch(() => setError('Record not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (record) setExpired(dayjs(record.policyExpiryDate).isBefore(dayjs()));
  }, [record]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error || !record) return <Alert severity="error">{error || 'Not found'}</Alert>;

  const expiry = dayjs(record.policyExpiryDate);

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/vehicle-records" underline="hover" color="inherit">Vehicle Records</MuiLink>
        <Typography color="text.primary">{record.vehicleNumber}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Vehicle Owner Details</Typography>
        <Button variant="contained" size="small" startIcon={<EditIcon />} component={NextLink} href={`/vehicle-records/${id}/edit`} disableElevation>
          Edit
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Vehicle Information</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}><Field label="Vehicle Number" value={record.vehicleNumber} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Field label="Owner Name" value={record.ownerName} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Field label="Primary Number" value={record.cellNumber} /></Grid>
          {record.cellNumberAlt && (
            <Grid size={{ xs: 12, sm: 4 }}><Field label="Secondary Number" value={record.cellNumberAlt} /></Grid>
          )}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Policy Information</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Category" value={<Chip label={record.category} size="small" color="primary" />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Policy Expiry Date" value={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {expiry.format('DD MMMM YYYY')}
                {expired && <Chip label="Expired" size="small" color="error" />}
              </Box>
            } />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Field label="Insurance Company" value={record.insuranceCompany} /></Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Documents</Typography>
        <Divider sx={{ mb: 2 }} />
        <DocumentCell record={record} />
      </Paper>
    </Box>
  );
}

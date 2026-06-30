'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Alert, Paper } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { vehicleRecordsApi } from '../../../../lib/api/vehicle-records';
import VehicleRecordTable from '../../../../components/vehicle-records/VehicleRecordTable';
import type { VehicleRecord } from '../../../../types/vehicle-record.types';

export default function ExpiredPoliciesPage() {
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehicleRecordsApi.getAll().then((all) => {
      const now = new Date();
      setRecords(all.filter((r) => new Date(r.policyExpiryDate) < now));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <EventBusyIcon color="error" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Expired Policies</Typography>
          <Typography variant="body2" color="text.secondary">{records.length} records with expired policies</Typography>
        </Box>
      </Box>
      {!loading && !records.length && <Alert severity="info">No expired policies found.</Alert>}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <VehicleRecordTable records={records} loading={loading} onDelete={() => {}} />
      </Paper>
    </Box>
  );
}

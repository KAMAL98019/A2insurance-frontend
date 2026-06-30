'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Alert, Paper } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { vehicleRecordsApi } from '../../../../lib/api/vehicle-records';
import VehicleRecordTable from '../../../../components/vehicle-records/VehicleRecordTable';
import type { VehicleRecord } from '../../../../types/vehicle-record.types';

export default function ExpiringPoliciesPage() {
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehicleRecordsApi.getAll().then((all) => {
      const now = new Date();
      const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
      setRecords(all.filter((r) => { const exp = new Date(r.policyExpiryDate); return exp >= now && exp <= in7; }));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <WarningAmberIcon color="warning" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Expiring Policies</Typography>
          <Typography variant="body2" color="text.secondary">Policies expiring within the next 7 days</Typography>
        </Box>
      </Box>
      {!loading && !records.length && <Alert severity="success">No policies expiring in the next 7 days.</Alert>}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <VehicleRecordTable records={records} loading={loading} onDelete={() => {}} />
      </Paper>
    </Box>
  );
}

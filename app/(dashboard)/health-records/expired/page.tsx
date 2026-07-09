'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Alert, Paper } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { healthInsuranceApi } from '../../../../lib/api/health-insurance';
import HealthInsuranceTable from '../../../../components/health-insurance/HealthInsuranceTable';
import type { HealthInsuranceRecord } from '../../../../types/health-insurance.types';

export default function ExpiredHealthPoliciesPage() {
  const [records, setRecords] = useState<HealthInsuranceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthInsuranceApi.getAll()
      .then((all) => {
        const now = new Date();
        setRecords(
          all.filter((r) =>
            r.policyStatus === 'EXPIRED' || new Date(r.renewalDate) < now,
          ),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <EventBusyIcon color="error" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Expired Health Policies</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading…' : `${records.length} record${records.length === 1 ? '' : 's'} with expired or overdue renewal`}
          </Typography>
        </Box>
      </Box>

      {!loading && records.length === 0 && (
        <Alert severity="info">No expired health policies found.</Alert>
      )}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <HealthInsuranceTable records={records} loading={loading} onDelete={() => {}} />
      </Paper>
    </Box>
  );
}

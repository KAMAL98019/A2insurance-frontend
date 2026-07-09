'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Alert, Paper, TextField, MenuItem,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { healthInsuranceApi } from '../../../../lib/api/health-insurance';
import HealthInsuranceTable from '../../../../components/health-insurance/HealthInsuranceTable';
import type { HealthInsuranceRecord } from '../../../../types/health-insurance.types';

const WINDOWS = [
  { label: 'Next 7 days',  days: 7  },
  { label: 'Next 15 days', days: 15 },
  { label: 'Next 30 days', days: 30 },
];

export default function ExpiringHealthPoliciesPage() {
  const [all,     setAll]     = useState<HealthInsuranceRecord[]>([]);
  const [days,    setDays]    = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthInsuranceApi.getAll()
      .then(setAll)
      .finally(() => setLoading(false));
  }, []);

  const records = all.filter((r) => {
    if (r.policyStatus === 'CANCELLED') return false;
    const renewal  = new Date(r.renewalDate);
    const now      = new Date();
    const cutoff   = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return renewal >= now && renewal <= cutoff;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Expiring Health Policies</Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Loading…' : `${records.length} polic${records.length === 1 ? 'y' : 'ies'} expiring within ${days} days`}
            </Typography>
          </Box>
        </Box>
        <TextField
          select size="small" label="Window" sx={{ width: 150 }}
          value={days} onChange={(e) => setDays(Number(e.target.value))}
        >
          {WINDOWS.map((w) => (
            <MenuItem key={w.days} value={w.days}>{w.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      {!loading && records.length === 0 && (
        <Alert severity="success">No health policies expiring in the next {days} days.</Alert>
      )}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <HealthInsuranceTable records={records} loading={loading} onDelete={() => {}} />
      </Paper>
    </Box>
  );
}

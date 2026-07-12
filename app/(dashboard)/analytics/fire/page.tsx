'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Divider, CircularProgress, Button, Breadcrumbs,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ArrowForwardIcon  from '@mui/icons-material/ArrowForward';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import EventBusyIcon     from '@mui/icons-material/EventBusy';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import NextLink from 'next/link';
import { fireInsuranceApi } from '../../../../lib/api/fire-insurance';
import { useLocationFilterStore } from '../../../../store/location-filter.store';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import type { FireInsuranceStats } from '../../../../types/fire-insurance.types';
import { SvgBarChart, SvgDonut } from '../../../../components/analytics/SvgBarChart';

const ACCENT = '#e65100';

function FireAnalyticsView() {
  const [stats,   setStats]   = useState<FireInsuranceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedLocationId = useLocationFilterStore((s) => s.selectedLocationId);

  useEffect(() => {
    setLoading(true);
    fireInsuranceApi.getStats(selectedLocationId).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [selectedLocationId]);

  const total   = stats?.total          ?? 0;
  const active  = stats?.active         ?? 0;
  const expired = stats?.expired        ?? 0;
  const pending = stats?.pendingRenewal ?? 0;
  const up30    = stats?.upcoming ?? 0;

  const kpis = [
    { label: 'Total Policies',      value: total,   color: ACCENT,    icon: <LocalFireDepartmentIcon /> },
    { label: 'Active Policies',     value: active,  color: '#2e7d32', icon: <CheckCircleIcon /> },
    { label: 'Expired Policies',    value: expired, color: '#c62828', icon: <EventBusyIcon /> },
    { label: 'Pending Renewal',     value: pending, color: '#f9a825', icon: <PendingActionsIcon /> },
    { label: 'Expiring in 30 Days', value: up30,    color: '#0277bd', icon: <WarningAmberIcon /> },
  ];

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Typography component={NextLink} href="/dashboard" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Dashboard</Typography>
        <Typography color="text.primary">Fire Analytics</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <LocalFireDepartmentIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Fire Insurance Analytics</Typography>
            <Typography variant="body2" color="text.secondary">Overview of all fire insurance policies</Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small" component={NextLink} href="/fire-records"
          endIcon={<ArrowForwardIcon fontSize="small" />}>All Records</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {kpis.map((k) => (
            <Grid key={k.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${k.color}`, borderRadius: 2 }}>
                <Box sx={{ color: k.color, mb: 0.75 }}>{k.icon}</Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', color: k.color, lineHeight: 1 }}>{k.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{k.label}</Typography>
              </Paper>
            </Grid>
          ))}

          {/* Status Donut */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Policy Status Distribution</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>{total} total fire policies</Typography>
              <Divider sx={{ mb: 2.5 }} />
              <SvgDonut size={150} data={[
                { label: 'Active',          value: active,  color: '#2e7d32' },
                { label: 'Expired',         value: expired, color: '#c62828' },
                { label: 'Pending Renewal', value: pending, color: '#f9a825' },
                { label: 'Expiring in 30d', value: up30,    color: '#0277bd' },
              ]} />
            </Paper>
          </Grid>

          {/* Policy Metrics Bar */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Policy Metrics</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Key figures at a glance</Typography>
              <Divider sx={{ mb: 2.5 }} />
              <SvgBarChart height={180} data={[
                { label: 'Active',    value: active,  color: '#2e7d32' },
                { label: 'Expired',   value: expired, color: '#c62828' },
                { label: 'Pending',   value: pending, color: '#f9a825' },
                { label: 'Exp. 30d',  value: up30,    color: '#0277bd' },
              ]} />
            </Paper>
          </Grid>

          {/* Quick links */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="contained" disableElevation size="small"
                  sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#bf360c' } }}
                  component={NextLink} href="/fire-records/add">Add Fire Policy</Button>
                <Button variant="outlined" size="small" component={NextLink} href="/fire-records">View All Records</Button>
                <Button variant="outlined" size="small" color="warning" startIcon={<WarningAmberIcon />}
                  component={NextLink} href="/fire-records/expiring">Expiring Policies</Button>
                <Button variant="outlined" size="small" color="error" startIcon={<EventBusyIcon />}
                  component={NextLink} href="/fire-records/expired">Expired Policies</Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default function FireAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['MASTER_ADMIN', 'SUPER_ADMIN']}>
      <FireAnalyticsView />
    </ProtectedRoute>
  );
}

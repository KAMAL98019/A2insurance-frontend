'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Divider, Chip, CircularProgress,
  Button, Breadcrumbs, List, ListItem,
} from '@mui/material';
import DirectionsCarIcon  from '@mui/icons-material/DirectionsCar';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import WarningAmberIcon   from '@mui/icons-material/WarningAmber';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import EventBusyIcon      from '@mui/icons-material/EventBusy';
import AutorenewIcon      from '@mui/icons-material/Autorenew';
import NextLink           from 'next/link';
import { dashboardApi }   from '../../../../lib/api/dashboard';
import { useLocationFilterStore } from '../../../../store/location-filter.store';
import ProtectedRoute     from '../../../../components/auth/ProtectedRoute';
import type { DashboardStats, ExpiryAlert } from '../../../../types/vehicle-record.types';
import { SvgBarChart, SvgDonut } from '../../../../components/analytics/SvgBarChart';

function AlertRowSmall({ alert }: { alert: ExpiryAlert }) {
  const d = alert.daysUntilExpiry;
  const urgent = d <= 3; const warn = d <= 7;
  return (
    <ListItem disablePadding component={NextLink} href={`/vehicle-records/${alert.id}`}
      sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        textDecoration: 'none', color: 'inherit', '&:last-child': { borderBottom: 'none' }, '&:hover': { bgcolor: 'grey.50' } }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, bgcolor: urgent ? 'error.main' : warn ? 'warning.main' : 'info.main' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{alert.vehicleNumber}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{alert.ownerName}</Typography>
      </Box>
      <Chip label={d === 0 ? 'Today' : `${d}d`} size="small"
        color={urgent ? 'error' : warn ? 'warning' : 'default'} variant={urgent ? 'filled' : 'outlined'}
        sx={{ fontSize: '0.67rem', fontWeight: 700, height: 20 }} />
    </ListItem>
  );
}

function VehicleAnalyticsView() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedLocationId = useLocationFilterStore((s) => s.selectedLocationId);

  useEffect(() => {
    setLoading(true);
    dashboardApi.getStats(selectedLocationId).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [selectedLocationId]);

  const total    = stats?.total            ?? 0;
  const expired  = stats?.expired          ?? 0;
  const active   = total - expired;
  const expiring = stats?.expiringIn7Days  ?? 0;
  const renewed  = stats?.renewedThisMonth ?? 0;
  const rt       = stats?.renewalTracking;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Typography component={NextLink} href="/dashboard" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Dashboard</Typography>
        <Typography color="text.primary">Vehicle Analytics</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#1a2980', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <DirectionsCarIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Vehicle Insurance Analytics</Typography>
            <Typography variant="body2" color="text.secondary">Overview of all vehicle insurance policies</Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small" component={NextLink} href="/vehicle-records"
          endIcon={<ArrowForwardIcon fontSize="small" />}>All Records</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* ── Summary KPIs ── */}
          {[
            { label: 'Total Vehicles',     value: total,    color: '#1a2980', icon: <DirectionsCarIcon /> },
            { label: 'Active Policies',    value: active,   color: '#2e7d32', icon: <CheckCircleIcon /> },
            { label: 'Expired Policies',   value: expired,  color: '#c62828', icon: <EventBusyIcon /> },
            { label: 'Expiring in 7d',     value: expiring, color: '#e65100', icon: <WarningAmberIcon /> },
            { label: 'Renewed This Month', value: renewed,  color: '#0277bd', icon: <AutorenewIcon /> },
          ].map((kpi) => (
            <Grid key={kpi.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${kpi.color}`, borderRadius: 2 }}>
                <Box sx={{ color: kpi.color, mb: 0.75 }}>{kpi.icon}</Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', color: kpi.color, lineHeight: 1 }}>{kpi.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{kpi.label}</Typography>
              </Paper>
            </Grid>
          ))}

          {/* ── Policy Status Breakdown (Donut) ── */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Policy Status Breakdown</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Distribution across {total} vehicles</Typography>
              <Divider sx={{ mb: 2.5 }} />
              <SvgDonut data={[
                { label: 'Active',         value: active,   color: '#2e7d32' },
                { label: 'Expired',        value: expired,  color: '#c62828' },
                { label: 'Expiring in 7d', value: expiring, color: '#e65100' },
              ]} size={150} />
            </Paper>
          </Grid>

          {/* ── Renewal Tracking (Bar chart) ── */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Renewal Tracking Status</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Current pipeline</Typography>
              <Divider sx={{ mb: 2.5 }} />
              {rt ? (
                <SvgBarChart height={180} data={[
                  { label: 'Total',       value: rt.total,      color: '#1a2980' },
                  { label: 'In Progress', value: rt.inProgress, color: '#e67e22' },
                  { label: 'Renewed',     value: rt.renewed,    color: '#2e7d32' },
                  { label: 'Cancelled',   value: rt.cancelled,  color: '#95a5a6' },
                ]} />
              ) : <Typography color="text.secondary">No renewal tracking data.</Typography>}
            </Paper>
          </Grid>

          {/* ── Category Breakdown (Bar chart) ── */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Vehicle Category Breakdown</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Vehicles by type</Typography>
              <Divider sx={{ mb: 2.5 }} />
              {stats?.categoryBreakdown.length ? (
                <SvgBarChart height={180} data={stats.categoryBreakdown.map((c) => ({
                  label: c.category, value: c.count, color: '#1a2980',
                }))} />
              ) : <Typography color="text.secondary">No category data.</Typography>}
            </Paper>
          </Grid>

          {/* ── Expiry Alerts ── */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Expiry Alerts (30 days)</Typography>
                <Chip label={`${stats?.expiryAlerts.length ?? 0} alerts`} size="small"
                  color={stats?.expiryAlerts.length ? 'warning' : 'default'} />
              </Box>
              <Divider />
              {!stats?.expiryAlerts.length ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 30, mb: 0.75 }} />
                  <Typography variant="body2" color="text.secondary">No alerts</Typography>
                </Box>
              ) : (
                <List disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
                  {stats.expiryAlerts.map((a) => <AlertRowSmall key={a.id} alert={a} />)}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default function VehicleAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['MASTER_ADMIN', 'SUPER_ADMIN']}>
      <VehicleAnalyticsView />
    </ProtectedRoute>
  );
}

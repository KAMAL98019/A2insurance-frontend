'use client';

import { useEffect, useState } from 'react';
import {
  Grid, Typography, Box, Divider, Chip, Button,
  CircularProgress, Paper, List, ListItem, LinearProgress,
} from '@mui/material';
import DirectionsCarIcon       from '@mui/icons-material/DirectionsCar';
import WarningAmberIcon        from '@mui/icons-material/WarningAmber';
import EventBusyIcon           from '@mui/icons-material/EventBusy';
import AutorenewIcon           from '@mui/icons-material/Autorenew';
import TrackChangesIcon        from '@mui/icons-material/TrackChanges';
import HourglassTopIcon        from '@mui/icons-material/HourglassTop';
import CheckCircleIcon         from '@mui/icons-material/CheckCircle';
import CancelIcon              from '@mui/icons-material/Cancel';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PieChartIcon            from '@mui/icons-material/PieChart';
import AddCircleOutlineIcon    from '@mui/icons-material/AddCircleOutlined';
import ArrowForwardIcon        from '@mui/icons-material/ArrowForward';
import FavoriteIcon            from '@mui/icons-material/Favorite';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EngineeringIcon         from '@mui/icons-material/Engineering';
import BarChartIcon            from '@mui/icons-material/BarChart';
import NextLink                from 'next/link';
import { useAuthStore }        from '../../../store/auth.store';
import { useLocationFilterStore } from '../../../store/location-filter.store';
import { dashboardApi }        from '../../../lib/api/dashboard';
import type { DashboardStats, ExpiryAlert } from '../../../types/vehicle-record.types';

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string; value: number; icon: React.ReactNode;
  accent: string; href: string; sub?: string; loading?: boolean; pulse?: boolean;
}
function KpiCard({ label, value, icon, accent, href, sub, loading, pulse }: KpiCardProps) {
  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', borderTop: `4px solid ${accent}`, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, ...(pulse && value > 0 ? { animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } } } : {}) }}>
            {icon}
          </Box>
          {sub && <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'grey.100', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.7rem' }}>{sub}</Typography>}
        </Box>
        {loading ? <CircularProgress size={28} sx={{ mb: 0.5 }} /> : (
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1, mb: 0.5, color: value > 0 && pulse ? accent : 'text.primary', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            {value}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
      </Box>
      <Divider />
      <Box sx={{ px: 2.5, py: 1 }}>
        <Button component={NextLink} href={href} size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
          sx={{ p: 0, fontSize: '0.75rem', color: accent, '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}>
          View details
        </Button>
      </Box>
    </Paper>
  );
}

// ─── Module overview card ──────────────────────────────────────────────────────

interface ModuleStat { total: number; active: number; expired: number; pendingRenewal: number; upcomingIn30: number }

interface ModuleCardProps {
  title: string; icon: React.ReactNode; accent: string;
  href: string; addHref: string; addLabel: string;
  stat: ModuleStat | null; loading: boolean;
}
function ModuleCard({ title, icon, accent, href, addHref, addLabel, stat, loading }: ModuleCardProps) {
  const rows = [
    { label: 'Total',           value: stat?.total        ?? 0, color: accent },
    { label: 'Active',          value: stat?.active       ?? 0, color: '#2e7d32' },
    { label: 'Expired',         value: stat?.expired      ?? 0, color: '#c62828' },
    { label: 'Expiring in 30d', value: stat?.upcomingIn30 ?? 0, color: '#e65100' },
  ];
  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', borderTop: `4px solid ${accent}`, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
        </Box>
        <Button component={NextLink} href={addHref} size="small" variant="outlined"
          sx={{ fontSize: '0.7rem', py: 0.4, minWidth: 0, px: 1.5, borderColor: accent, color: accent, '&:hover': { borderColor: accent, bgcolor: `${accent}10` } }}>
          + {addLabel}
        </Button>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
        ) : (
          <Grid container spacing={1.5}>
            {rows.map((r) => (
              <Grid key={r.label} size={{ xs: 6 }}>
                <Box sx={{ textAlign: 'center', p: 1.25, borderRadius: 1.5, bgcolor: `${r.color}0d`, border: `1px solid ${r.color}25` }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: r.color, lineHeight: 1 }}>{r.value}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block', mt: 0.4 }}>{r.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      <Divider />
      <Box sx={{ px: 2.5, py: 1 }}>
        <Button component={NextLink} href={href} size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
          sx={{ p: 0, fontSize: '0.75rem', color: accent, '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}>
          View all records
        </Button>
      </Box>
    </Paper>
  );
}

// ─── Expiry alert row ──────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: ExpiryAlert }) {
  const d = alert.daysUntilExpiry;
  const urgent = d <= 3;
  const warn   = d <= 7;
  return (
    <ListItem disablePadding component={NextLink} href={`/vehicle-records/${alert.id}`}
      sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        textDecoration: 'none', color: 'inherit', '&:last-child': { borderBottom: 'none' }, '&:hover': { bgcolor: 'grey.50' }, transition: 'background 0.15s' }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: urgent ? 'error.main' : warn ? 'warning.main' : 'info.main', boxShadow: urgent ? '0 0 0 3px rgba(211,47,47,0.2)' : 'none' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{alert.vehicleNumber}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{alert.ownerName} · {alert.cellNumber}</Typography>
      </Box>
      <Chip label={alert.category} size="small" sx={{ fontSize: '0.65rem', height: 20, display: { xs: 'none', sm: 'flex' } }} />
      <Chip label={d === 0 ? 'Today!' : d === 1 ? 'Tomorrow' : `${d} days`} size="small"
        color={urgent ? 'error' : warn ? 'warning' : 'default'} variant={urgent ? 'filled' : 'outlined'}
        sx={{ fontSize: '0.68rem', fontWeight: 700, minWidth: 72, height: 22 }} />
    </ListItem>
  );
}

// ─── Category bar ──────────────────────────────────────────────────────────────

function CategoryBar({ category, count, max }: { category: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{category}</Typography>
        <Typography variant="body2" color="text.secondary">{count}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct}
        sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#1a2980' } }} />
    </Box>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardView() {
  const user = useAuthStore((s) => s.user);
  const selectedLocationId = useLocationFilterStore((s) => s.selectedLocationId);
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [today,   setToday]   = useState('');

  useEffect(() => {
    setLoading(true);
    dashboardApi.getStats(selectedLocationId).then(setStats).catch(console.error).finally(() => setLoading(false));
    setToday(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, [selectedLocationId]);

  const maxCategory = Math.max(...(stats?.categoryBreakdown.map((c) => c.count) ?? [1]));

  const vehicleStat: ModuleStat | null = stats ? {
    total:        stats.total,
    active:       stats.total - stats.expired,
    expired:      stats.expired,
    pendingRenewal: 0,
    upcomingIn30: stats.expiryAlerts.length,
  } : null;

  return (
    <Box>
      {/* ── Welcome ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Welcome back, {user?.name?.split(' ')[0] ?? 'User'} 👋
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">{today}</Typography>
            {user?.role === 'MASTER_ADMIN' && <Chip label="Master Admin" size="small" color="primary" sx={{ fontWeight: 600 }} />}
            {user?.role === 'SUPER_ADMIN' && <Chip label="Super Admin" size="small" color="secondary" sx={{ fontWeight: 600 }} />}
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<BarChartIcon />}
          component={NextLink} href="/analytics/vehicle" disableElevation>
          Analytics
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ── Insurance Portfolio Overview ── */}
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 1.5, display: 'block' }}>
        Insurance Portfolio Overview
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <ModuleCard title="Vehicle Insurance" icon={<DirectionsCarIcon />} accent="#1a2980"
            href="/vehicle-records" addHref="/vehicle-records/add" addLabel="Vehicle"
            stat={vehicleStat} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <ModuleCard title="Health Insurance" icon={<FavoriteIcon />} accent="#c62828"
            href="/health-records" addHref="/health-records/add" addLabel="Health"
            stat={stats?.healthInsurance ?? null} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <ModuleCard title="Fire Insurance" icon={<LocalFireDepartmentIcon />} accent="#e65100"
            href="/fire-records" addHref="/fire-records/add" addLabel="Fire"
            stat={stats?.fireInsurance ?? null} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <ModuleCard title="Labour Insurance" icon={<EngineeringIcon />} accent="#1b5e20"
            href="/labour-records" addHref="/labour-records/add" addLabel="Labour"
            stat={stats?.labourInsurance ?? null} loading={loading} />
        </Grid>
      </Grid>

      {/* ── Vehicle KPIs ── */}
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 1.5, display: 'block' }}>
        Vehicle — Renewal Tracking
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="Total Vehicles"     value={stats?.total               ?? 0} icon={<DirectionsCarIcon />}  accent="#1a2980" href="/vehicle-records"                loading={loading} sub="all records" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="Expiring in 7 Days" value={stats?.expiringIn7Days     ?? 0} icon={<WarningAmberIcon />}   accent="#f39c12" href="/vehicle-records/expiring"      loading={loading} sub="urgent" pulse />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="In Progress"        value={stats?.renewalTracking?.inProgress ?? 0} icon={<HourglassTopIcon />}  accent="#e67e22" href="/vehicle-records"  loading={loading} sub="active" pulse />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard label="Renewed This Month" value={stats?.renewedThisMonth    ?? 0} icon={<AutorenewIcon />}      accent="#27ae60" href="/vehicle-records/renewal-history" loading={loading} sub="this month" />
        </Grid>
      </Grid>

      {/* ── Alerts + Category ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ borderRadius: 2, height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActiveIcon color="warning" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vehicle Expiry Alerts</Typography>
                {stats && (
                  <Chip label={`${stats.expiryAlerts.length} in 30 days`} size="small"
                    color={stats.expiryAlerts.length > 0 ? 'warning' : 'default'} sx={{ fontSize: '0.68rem' }} />
                )}
              </Box>
              <Button size="small" component={NextLink} href="/vehicle-records/expiring"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />} sx={{ fontSize: '0.75rem' }}>
                View All
              </Button>
            </Box>
            <Divider />
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : !stats?.expiryAlerts.length ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No vehicle policies expiring in 30 days</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {stats.expiryAlerts.map((a) => <AlertRow key={a.id} alert={a} />)}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ borderRadius: 2, height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieChartIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vehicle Category Breakdown</Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 2.5, py: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
              ) : !stats?.categoryBreakdown.length ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No data yet</Typography>
              ) : (
                <>
                  {stats.categoryBreakdown.map((c) => (
                    <CategoryBar key={c.category} category={c.category} count={c.count} max={maxCategory} />
                  ))}
                  <Divider sx={{ mt: 2, mb: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Total vehicles</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Quick Actions ── */}
      <Paper sx={{ borderRadius: 2, p: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>QUICK ACTIONS</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" disableElevation size="small" startIcon={<AddCircleOutlineIcon />}
            component={NextLink} href="/vehicle-records/add">Add Vehicle</Button>
          <Button variant="outlined" size="small" startIcon={<FavoriteIcon />} color="error"
            component={NextLink} href="/health-records/add">Add Health</Button>
          <Button variant="outlined" size="small" startIcon={<LocalFireDepartmentIcon />}
            sx={{ color: '#e65100', borderColor: '#e65100', '&:hover': { borderColor: '#e65100', bgcolor: '#e651000d' } }}
            component={NextLink} href="/fire-records/add">Add Fire</Button>
          <Button variant="outlined" size="small" startIcon={<EngineeringIcon />} color="success"
            component={NextLink} href="/labour-records/add">Add Labour</Button>
          <Button variant="outlined" size="small" startIcon={<TrackChangesIcon />}
            component={NextLink} href="/vehicle-records">Track Renewals</Button>
          <Button variant="outlined" size="small" color="warning" startIcon={<WarningAmberIcon />}
            component={NextLink} href="/vehicle-records/expiring">Expiring</Button>
          <Button variant="outlined" size="small" color="error" startIcon={<EventBusyIcon />}
            component={NextLink} href="/vehicle-records/expired">Expired</Button>
          <Button variant="outlined" size="small" startIcon={<AutorenewIcon />}
            component={NextLink} href="/vehicle-records/renewal-history">History</Button>
          <Button variant="outlined" size="small" startIcon={<CancelIcon />}
            sx={{ color: 'text.secondary', borderColor: 'divider' }}
            component={NextLink} href="/analytics/vehicle">Analytics</Button>
        </Box>
      </Paper>
    </Box>
  );
}

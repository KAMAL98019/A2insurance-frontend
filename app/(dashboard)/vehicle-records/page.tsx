'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  ToggleButtonGroup, ToggleButton, TextField, MenuItem, Menu,
  Divider, Chip, Grid, IconButton, Tooltip, Popover, Badge,
} from '@mui/material';
import AddIcon          from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableRowsIcon    from '@mui/icons-material/TableRows';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterAltIcon   from '@mui/icons-material/FilterAlt';
import SearchIcon      from '@mui/icons-material/Search';
import ClearIcon       from '@mui/icons-material/Clear';
import NextLink        from 'next/link';
import dayjs, { Dayjs } from 'dayjs';
import isBetween       from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

import { vehicleRecordsApi } from '../../../lib/api/vehicle-records';
import { categoriesApi }      from '../../../lib/api/categories';
import { parseApiError }      from '../../../lib/parse-error';
import { useToast }           from '../../../providers/ToastProvider';
import { exportToExcel, exportToCSV } from '../../../lib/export';
import VehicleRecordTable from '../../../components/vehicle-records/VehicleRecordTable';
import VehicleCalendarView from '../../../components/vehicle-records/VehicleCalendarView';
import type { VehicleRecord, VehicleCategory } from '../../../types/vehicle-record.types';

type ViewMode       = 'table' | 'calendar';
type FilterRange    = 'all' | 'today' | 'week' | 'month' | 'custom';
type TrackingFilter = 'ALL' | 'NOT_STARTED' | 'CONTACTED' | 'DOCS_COLLECTED' | 'PROCESSING' | 'PAYMENT_PENDING' | 'RENEWED' | 'CANCELLED';

const TRACKING_OPTIONS: { value: TrackingFilter; label: string; color?: string }[] = [
  { value: 'ALL',             label: 'All Statuses'    },
  { value: 'NOT_STARTED',     label: 'Not Started',     color: '#9e9e9e' },
  { value: 'CONTACTED',       label: 'Contacted',       color: '#1565c0' },
  { value: 'DOCS_COLLECTED',  label: 'Docs Collected',  color: '#6a1b9a' },
  { value: 'PROCESSING',      label: 'Processing',      color: '#0277bd' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending', color: '#e65100' },
  { value: 'RENEWED',         label: 'Renewed',         color: '#2e7d32' },
  { value: 'CANCELLED',       label: 'Cancelled',       color: '#757575' },
];

function VehicleRecordsContent() {
  const { showError, showSuccess } = useToast();
  const searchParams = useSearchParams();
  const [all,        setAll]        = useState<VehicleRecord[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);

  // View toggle
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filters
  const [range,          setRange]          = useState<FilterRange>('all');
  const [customFrom,     setCustomFrom]     = useState<Dayjs | null>(null);
  const [customTo,       setCustomTo]       = useState<Dayjs | null>(null);
  const [category,       setCategory]       = useState<string>('ALL');
  const [trackingStatus, setTrackingStatus] = useState<TrackingFilter>('ALL');
  const [search,         setSearch]         = useState('');

  // Filter popover anchor
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);

  // Export menu
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    vehicleRecordsApi.getAll()
      .then(setAll)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  // Apply ?from=&to= query params after mount (avoids SSR/client hydration mismatch)
  useEffect(() => {
    const from = searchParams.get('from');
    const to   = searchParams.get('to');
    if (from && to) {
      setRange('custom');
      setCustomFrom(dayjs(from));
      setCustomTo(dayjs(to));
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const now  = dayjs();
    let result = [...all];

    if (range === 'today') {
      result = result.filter((r) => dayjs(r.policyExpiryDate).isSame(now, 'day'));
    } else if (range === 'week') {
      result = result.filter((r) => dayjs(r.policyExpiryDate).isBetween(now.startOf('week'), now.endOf('week'), null, '[]'));
    } else if (range === 'month') {
      result = result.filter((r) => dayjs(r.policyExpiryDate).isSame(now, 'month'));
    } else if (range === 'custom' && customFrom && customTo) {
      result = result.filter((r) => dayjs(r.policyExpiryDate).isBetween(customFrom, customTo, null, '[]'));
    }

    if (category !== 'ALL') {
      result = result.filter((r) => r.category === category);
    }

    if (trackingStatus === 'NOT_STARTED') {
      result = result.filter((r) => !r.renewals?.length);
    } else if (trackingStatus !== 'ALL') {
      result = result.filter((r) => r.renewals?.[0]?.status === trackingStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.vehicleNumber.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.cellNumber.includes(q) ||
          (r.cellNumberAlt ?? '').includes(q) ||
          r.insuranceCompany.toLowerCase().includes(q),
      );
    }

    return result;
  }, [all, range, customFrom, customTo, category, trackingStatus, search]);

  // Count of active non-search filters for the badge
  const activeFilterCount = [
    range !== 'all',
    category !== 'ALL',
    trackingStatus !== 'ALL',
  ].filter(Boolean).length;

  const hasFilters = activeFilterCount > 0 || !!search.trim();

  const clearFilters = () => {
    setRange('all'); setCategory('ALL'); setTrackingStatus('ALL');
    setSearch(''); setCustomFrom(null); setCustomTo(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await vehicleRecordsApi.remove(deleteId);
      setAll((prev) => prev.filter((r) => r.id !== deleteId));
      showSuccess('Vehicle record deleted.');
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setDeleteId(null);
    }
  };

  const trackingOpt = TRACKING_OPTIONS.find((o) => o.value === trackingStatus);

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 2 }}>

        {/* Title row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Vehicle Records</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} of {all.length} records
              </Typography>
              {hasFilters && (
                <Chip label="Filtered" size="small" onDelete={clearFilters} sx={{ height: 18, fontSize: '0.68rem' }} />
              )}
            </Box>
          </Box>

          {/* Desktop-only: view toggle + export + add */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup value={viewMode} exclusive size="small" onChange={(_, v) => v && setViewMode(v)}>
              <ToggleButton value="table"><Tooltip title="Table"><TableRowsIcon fontSize="small" /></Tooltip></ToggleButton>
              <ToggleButton value="calendar"><Tooltip title="Calendar"><CalendarMonthIcon fontSize="small" /></Tooltip></ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}
              onClick={(e) => setExportAnchor(e.currentTarget)}>
              Export
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              component={NextLink} href="/vehicle-records/add" disableElevation>
              Add Vehicle
            </Button>
          </Box>
        </Box>

        {/* Export menu */}
        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
          <MenuItem onClick={() => { exportToExcel(filtered, 'vehicle-records'); setExportAnchor(null); }}>
            Download Excel (.xlsx) — {filtered.length} rows
          </MenuItem>
          <MenuItem onClick={() => { exportToCSV(filtered, 'vehicle-records'); setExportAnchor(null); }}>
            Download CSV — {filtered.length} rows
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { exportToExcel(all, 'vehicle-records-all'); setExportAnchor(null); }}>
            Download ALL data (Excel)
          </MenuItem>
          <MenuItem onClick={() => { exportToCSV(all, 'vehicle-records-all'); setExportAnchor(null); }}>
            Download ALL data (CSV)
          </MenuItem>
        </Menu>

        {/* Search + filter bar */}
        {viewMode !== 'calendar' && (
          <Paper sx={{ px: 1.5, py: 1, borderRadius: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small" placeholder="Search vehicle no., owner, phone…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 0 }}
                slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} /> } }}
              />

              {hasFilters && (
                <Tooltip title="Clear all filters">
                  <IconButton size="small" onClick={clearFilters} color="error" sx={{ flexShrink: 0 }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Badge badgeContent={activeFilterCount} color="primary" overlap="circular" sx={{ flexShrink: 0 }}>
                <Button
                  variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
                  size="small" disableElevation
                  startIcon={<FilterAltIcon fontSize="small" />}
                  onClick={(e) => setFilterAnchor(e.currentTarget)}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Filters
                </Button>
              </Badge>

              {/* Mobile-only: Add Vehicle */}
              <Button
                variant="contained" size="small" disableElevation
                component={NextLink} href="/vehicle-records/add"
                sx={{ display: { xs: 'flex', sm: 'none' }, flexShrink: 0, minWidth: 0, px: 1.5 }}
              >
                <AddIcon fontSize="small" />
              </Button>
            </Box>

            {/* Active filter chips — shown below search on mobile */}
            {activeFilterCount > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                {range !== 'all' && (
                  <Chip label={`Expiry: ${range}`} size="small" variant="outlined" color="primary"
                    onDelete={() => { setRange('all'); setCustomFrom(null); setCustomTo(null); }} />
                )}
                {category !== 'ALL' && (
                  <Chip label={`Category: ${category}`} size="small" variant="outlined" color="secondary"
                    onDelete={() => setCategory('ALL')} />
                )}
                {trackingStatus !== 'ALL' && trackingOpt && (
                  <Chip
                    label={`Tracking: ${trackingOpt.label}`} size="small" variant="outlined"
                    sx={{ borderColor: trackingOpt.color, color: trackingOpt.color }}
                    onDelete={() => setTrackingStatus('ALL')}
                    icon={<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: trackingOpt.color, ml: '6px !important' }} />}
                  />
                )}
              </Box>
            )}
          </Paper>
        )}

        {/* Mobile-only: secondary action bar */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup value={viewMode} exclusive size="small" onChange={(_, v) => v && setViewMode(v)}>
            <ToggleButton value="table"><Tooltip title="Table"><TableRowsIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="calendar"><Tooltip title="Calendar"><CalendarMonthIcon fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}
            onClick={(e) => setExportAnchor(e.currentTarget)}>
            Export
          </Button>
        </Box>
      </Box>

      {/* ── Filter Popover ── */}
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: 2.5, boxShadow: 8, mt: 0.75, width: 360, maxWidth: 'calc(100vw - 32px)' } } }}
      >
        <Box sx={{ p: 2.5 }}>
          {/* Popover header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterAltIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Filter Records</Typography>
              {activeFilterCount > 0 && (
                <Chip label={`${activeFilterCount} active`} size="small" color="primary" sx={{ fontSize: '0.68rem', height: 18 }} />
              )}
            </Box>
            {activeFilterCount > 0 && (
              <Button size="small" color="error" onClick={clearFilters} sx={{ fontSize: '0.72rem', py: 0.25 }}>
                Clear All
              </Button>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Policy Expiry */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, letterSpacing: 0.4 }}>
            POLICY EXPIRY
          </Typography>
          <ToggleButtonGroup
            value={range} exclusive size="small" fullWidth
            onChange={(_, v) => v && setRange(v)}
            sx={{ mb: 2 }}
          >
            {([
              { value: 'all',    label: 'All'    },
              { value: 'today',  label: 'Today'  },
              { value: 'week',   label: 'Week'   },
              { value: 'month',  label: 'Month'  },
              { value: 'custom', label: 'Custom' },
            ] as { value: FilterRange; label: string }[]).map((r) => (
              <ToggleButton key={r.value} value={r.value} sx={{ fontSize: '0.72rem', py: 0.5 }}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Custom date range */}
          {range === 'custom' && (
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  From
                </Typography>
                <TextField
                  size="small" type="date" fullWidth
                  value={customFrom ? customFrom.format('YYYY-MM-DD') : ''}
                  onChange={(e) => setCustomFrom(e.target.value ? dayjs(e.target.value) : null)}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  To
                </Typography>
                <TextField
                  size="small" type="date" fullWidth
                  value={customTo ? customTo.format('YYYY-MM-DD') : ''}
                  onChange={(e) => setCustomTo(e.target.value ? dayjs(e.target.value) : null)}
                />
              </Grid>
            </Grid>
          )}

          {/* Category */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, letterSpacing: 0.4 }}>
            CATEGORY
          </Typography>
          <TextField
            select size="small" fullWidth sx={{ mb: 2 }}
            value={category} onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="ALL">All Categories</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
          </TextField>

          {/* Tracking Status */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, letterSpacing: 0.4 }}>
            TRACKING STATUS
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {TRACKING_OPTIONS.map((opt) => {
              const active = trackingStatus === opt.value;
              return (
                <Box
                  key={opt.value}
                  onClick={() => setTrackingStatus(opt.value)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.6,
                    px: 1.25, py: 0.5,
                    borderRadius: 5,
                    border: '1.5px solid',
                    borderColor: active ? (opt.color ?? 'primary.main') : 'divider',
                    bgcolor: active ? `${opt.color ?? '#1976d2'}18` : 'transparent',
                    color: active ? (opt.color ?? 'primary.main') : 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s',
                    '&:hover': { borderColor: opt.color ?? 'primary.main', color: opt.color ?? 'primary.main' },
                  }}
                >
                  {opt.color && (
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: opt.color, flexShrink: 0 }} />
                  )}
                  {opt.label}
                </Box>
              );
            })}
          </Box>

          <Divider sx={{ mt: 2.5, mb: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained" size="small" disableElevation
              onClick={() => setFilterAnchor(null)}
            >
              Done
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* ── Content ── */}
      {viewMode === 'table' ? (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <VehicleRecordTable records={filtered} loading={loading} onDelete={setDeleteId} />
        </Paper>
      ) : (
        <VehicleCalendarView records={filtered} />
      )}

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Vehicle Record</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone. Are you sure?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disableElevation>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function VehicleRecordsPage() {
  return (
    <Suspense>
      <VehicleRecordsContent />
    </Suspense>
  );
}

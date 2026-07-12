'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import {
  Box, Typography, Button, Paper, Menu,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, MenuItem, Chip, IconButton, Tooltip, Badge, Popover, Divider,
} from '@mui/material';
import AddIcon          from '@mui/icons-material/Add';
import SearchIcon       from '@mui/icons-material/Search';
import ClearIcon        from '@mui/icons-material/Clear';
import FilterAltIcon    from '@mui/icons-material/FilterAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NextLink         from 'next/link';

import { healthInsuranceApi } from '../../../lib/api/health-insurance';
import { exportHealthToExcel, exportHealthToCSV } from '../../../lib/export';
import { parseApiError }       from '../../../lib/parse-error';
import { useToast }            from '../../../providers/ToastProvider';
import { useLocationFilterStore } from '../../../store/location-filter.store';
import { useCan } from '../../../hooks/useCan';
import HealthInsuranceTable    from '../../../components/health-insurance/HealthInsuranceTable';
import type { HealthInsuranceRecord, HealthPolicyStatus, HealthPolicyType, HealthCustomerType } from '../../../types/health-insurance.types';
import { POLICY_STATUS_LABELS, POLICY_TYPE_LABELS } from '../../../types/health-insurance.types';

const STATUSES: HealthPolicyStatus[] = ['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED'];
const TYPES: HealthPolicyType[] = ['INDIVIDUAL', 'FAMILY_FLOATER', 'SENIOR_CITIZEN', 'GROUP_INSURANCE', 'CRITICAL_ILLNESS'];

function HealthRecordsContent() {
  const { showError, showSuccess } = useToast();
  const selectedLocationId = useLocationFilterStore((s) => s.selectedLocationId);
  const canCreate = useCan('health-insurance', 'create');
  const canExport = useCan('health-insurance', 'export');

  const [all,       setAll]       = useState<HealthInsuranceRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [deleteId,  setDeleteId]  = useState<number | null>(null);

  const [search,         setSearch]         = useState('');
  const [policyStatus,   setPolicyStatus]   = useState<HealthPolicyStatus | 'ALL'>('ALL');
  const [policyType,     setPolicyType]     = useState<HealthPolicyType | 'ALL'>('ALL');
  const [customerType,   setCustomerType]   = useState<HealthCustomerType | 'ALL'>('ALL');
  const [filterAnchor,   setFilterAnchor]   = useState<HTMLElement | null>(null);
  const [exportAnchor,   setExportAnchor]   = useState<HTMLElement | null>(null);

  useEffect(() => {
    setLoading(true);
    healthInsuranceApi.getAll({ locationId: selectedLocationId })
      .then(setAll)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [selectedLocationId]);

  const filtered = useMemo(() => {
    let result = [...all];

    if (policyStatus !== 'ALL') result = result.filter((r) => r.policyStatus === policyStatus);
    if (policyType   !== 'ALL') result = result.filter((r) => r.policyType   === policyType);
    if (customerType !== 'ALL') result = result.filter((r) => r.customerType === customerType);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.policyNumber.toLowerCase().includes(q) ||
          r.policyHolderName.toLowerCase().includes(q) ||
          r.mobileNumber.includes(q) ||
          r.insuranceCompanyName.toLowerCase().includes(q),
      );
    }

    return result;
  }, [all, policyStatus, policyType, customerType, search]);

  const activeFilterCount = [
    policyStatus !== 'ALL',
    policyType   !== 'ALL',
    customerType !== 'ALL',
  ].filter(Boolean).length;

  const hasFilters = activeFilterCount > 0 || !!search.trim();

  const clearFilters = () => {
    setPolicyStatus('ALL'); setPolicyType('ALL'); setCustomerType('ALL'); setSearch('');
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await healthInsuranceApi.remove(deleteId);
      setAll((prev) => prev.filter((r) => r.id !== deleteId));
      showSuccess('Health insurance record deleted.');
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Health Insurance Records</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} of {all.length} records
              </Typography>
              {hasFilters && (
                <Chip label="Filtered" size="small" onDelete={clearFilters} sx={{ height: 18, fontSize: '0.68rem' }} />
              )}
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {canExport && (
              <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}
                onClick={(e) => setExportAnchor(e.currentTarget)}>
                Export
              </Button>
            )}
            {canCreate && (
              <Button variant="contained" size="small" startIcon={<AddIcon />}
                component={NextLink} href="/health-records/add" disableElevation>
                Add Policy
              </Button>
            )}
          </Box>
        </Box>

        {/* Export menu */}
        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
          <MenuItem onClick={() => { exportHealthToExcel(filtered, 'health-insurance'); setExportAnchor(null); }}>
            Download Excel (.xlsx) — {filtered.length} rows
          </MenuItem>
          <MenuItem onClick={() => { exportHealthToCSV(filtered, 'health-insurance'); setExportAnchor(null); }}>
            Download CSV — {filtered.length} rows
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { exportHealthToExcel(all, 'health-insurance-all'); setExportAnchor(null); }}>
            Download ALL data (Excel)
          </MenuItem>
          <MenuItem onClick={() => { exportHealthToCSV(all, 'health-insurance-all'); setExportAnchor(null); }}>
            Download ALL data (CSV)
          </MenuItem>
        </Menu>

        {/* Search + Filter bar */}
        <Paper sx={{ px: 1.5, py: 1, borderRadius: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search policy no., holder, phone, company…"
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
                sx={{ whiteSpace: 'nowrap' }}>
                Filters
              </Button>
            </Badge>
            {canCreate && (
              <Button variant="contained" size="small" disableElevation
                component={NextLink} href="/health-records/add"
                sx={{ display: { xs: 'flex', md: 'none' }, flexShrink: 0, minWidth: 0, px: 1.5 }}>
                <AddIcon fontSize="small" />
              </Button>
            )}
          </Box>

          {activeFilterCount > 0 && (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
              {policyStatus !== 'ALL' && (
                <Chip label={`Status: ${POLICY_STATUS_LABELS[policyStatus as HealthPolicyStatus]}`} size="small" variant="outlined" color="primary"
                  onDelete={() => setPolicyStatus('ALL')} />
              )}
              {policyType !== 'ALL' && (
                <Chip label={`Type: ${POLICY_TYPE_LABELS[policyType as HealthPolicyType]}`} size="small" variant="outlined" color="secondary"
                  onDelete={() => setPolicyType('ALL')} />
              )}
              {customerType !== 'ALL' && (
                <Chip label={`Customer: ${customerType}`} size="small" variant="outlined"
                  onDelete={() => setCustomerType('ALL')} />
              )}
            </Box>
          )}
        </Paper>
      </Box>

      {/* ── Filter Popover ── */}
      <Popover
        open={Boolean(filterAnchor)} anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: 2.5, boxShadow: 8, mt: 0.75, width: 320, maxWidth: 'calc(100vw - 32px)' } } }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterAltIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Filter Records</Typography>
            </Box>
            {activeFilterCount > 0 && (
              <Button size="small" color="error" onClick={clearFilters} sx={{ fontSize: '0.72rem', py: 0.25 }}>
                Clear All
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, letterSpacing: 0.4 }}>
            POLICY STATUS
          </Typography>
          <TextField select size="small" fullWidth sx={{ mb: 2 }}
            value={policyStatus} onChange={(e) => setPolicyStatus(e.target.value as HealthPolicyStatus | 'ALL')}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{POLICY_STATUS_LABELS[s]}</MenuItem>)}
          </TextField>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, letterSpacing: 0.4 }}>
            POLICY TYPE
          </Typography>
          <TextField select size="small" fullWidth sx={{ mb: 2 }}
            value={policyType} onChange={(e) => setPolicyType(e.target.value as HealthPolicyType | 'ALL')}>
            <MenuItem value="ALL">All Types</MenuItem>
            {TYPES.map((t) => <MenuItem key={t} value={t}>{POLICY_TYPE_LABELS[t]}</MenuItem>)}
          </TextField>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, letterSpacing: 0.4 }}>
            CUSTOMER TYPE
          </Typography>
          <TextField select size="small" fullWidth sx={{ mb: 2 }}
            value={customerType} onChange={(e) => setCustomerType(e.target.value as HealthCustomerType | 'ALL')}>
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="NEW">New</MenuItem>
            <MenuItem value="RENEWAL">Renewal</MenuItem>
          </TextField>

          <Divider sx={{ mt: 1, mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" size="small" disableElevation onClick={() => setFilterAnchor(null)}>Done</Button>
          </Box>
        </Box>
      </Popover>

      {/* ── Table ── */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <HealthInsuranceTable records={filtered} loading={loading} onDelete={setDeleteId} />
      </Paper>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Health Insurance Record</DialogTitle>
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

export default function HealthRecordsPage() {
  return (
    <Suspense>
      <HealthRecordsContent />
    </Suspense>
  );
}

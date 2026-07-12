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

import { labourInsuranceApi } from '../../../lib/api/labour-insurance';
import { exportLabourToExcel, exportLabourToCSV } from '../../../lib/export';
import { parseApiError }      from '../../../lib/parse-error';
import { useToast }           from '../../../providers/ToastProvider';
import { useLocationFilterStore } from '../../../store/location-filter.store';
import { useCan } from '../../../hooks/useCan';
import LabourInsuranceTable   from '../../../components/labour-insurance/LabourInsuranceTable';
import type { LabourInsuranceRecord, LabourPolicyStatus, LabourCustomerType, LabourPolicyType } from '../../../types/labour-insurance.types';
import { LABOUR_STATUS_LABELS, LABOUR_POLICY_TYPE_LABELS } from '../../../types/labour-insurance.types';

const STATUSES: LabourPolicyStatus[] = ['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED'];
const POLICY_TYPES: LabourPolicyType[] = ['UNNAMED', 'NAMED'];

function LabourRecordsContent() {
  const { showError, showSuccess } = useToast();
  const selectedLocationId = useLocationFilterStore((s) => s.selectedLocationId);
  const canCreate = useCan('labour-insurance', 'create');
  const canExport = useCan('labour-insurance', 'export');

  const [all,      setAll]      = useState<LabourInsuranceRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [search,           setSearch]           = useState('');
  const [policyStatus,     setPolicyStatus]     = useState<LabourPolicyStatus | 'ALL'>('ALL');
  const [labourPolicyType, setLabourPolicyType] = useState<LabourPolicyType | 'ALL'>('ALL');
  const [customerType,     setCustomerType]     = useState<LabourCustomerType | 'ALL'>('ALL');
  const [filterAnchor,     setFilterAnchor]     = useState<HTMLElement | null>(null);
  const [exportAnchor,     setExportAnchor]     = useState<HTMLElement | null>(null);

  useEffect(() => {
    setLoading(true);
    labourInsuranceApi.getAll({ locationId: selectedLocationId })
      .then(setAll)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [selectedLocationId]);

  const filtered = useMemo(() => {
    let result = [...all];
    if (policyStatus     !== 'ALL') result = result.filter((r) => r.policyStatus     === policyStatus);
    if (labourPolicyType !== 'ALL') result = result.filter((r) => r.labourPolicyType === labourPolicyType);
    if (customerType     !== 'ALL') result = result.filter((r) => r.customerType     === customerType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.policyNumber.toLowerCase().includes(q) ||
          r.insuredName.toLowerCase().includes(q) ||
          r.mobileNumber.includes(q) ||
          r.insuranceCompanyName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [all, policyStatus, labourPolicyType, customerType, search]);

  const activeFilterCount = [policyStatus !== 'ALL', labourPolicyType !== 'ALL', customerType !== 'ALL'].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0 || !!search.trim();

  const clearFilters = () => { setPolicyStatus('ALL'); setLabourPolicyType('ALL'); setCustomerType('ALL'); setSearch(''); };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await labourInsuranceApi.remove(deleteId);
      setAll((prev) => prev.filter((r) => r.id !== deleteId));
      showSuccess('Labour insurance record deleted.');
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
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Labour Insurance Records</Typography>
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
                component={NextLink} href="/labour-records/add" disableElevation>
                Add Policy
              </Button>
            )}
          </Box>
        </Box>

        {/* Export menu */}
        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
          <MenuItem onClick={() => { exportLabourToExcel(filtered, 'labour-insurance'); setExportAnchor(null); }}>
            Download Excel (.xlsx) — {filtered.length} rows
          </MenuItem>
          <MenuItem onClick={() => { exportLabourToCSV(filtered, 'labour-insurance'); setExportAnchor(null); }}>
            Download CSV — {filtered.length} rows
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { exportLabourToExcel(all, 'labour-insurance-all'); setExportAnchor(null); }}>
            Download ALL data (Excel)
          </MenuItem>
          <MenuItem onClick={() => { exportLabourToCSV(all, 'labour-insurance-all'); setExportAnchor(null); }}>
            Download ALL data (CSV)
          </MenuItem>
        </Menu>

        <Paper sx={{ px: 1.5, py: 1, borderRadius: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search policy no., company, phone, insurer…"
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
                component={NextLink} href="/labour-records/add"
                sx={{ display: { xs: 'flex', md: 'none' }, flexShrink: 0, minWidth: 0, px: 1.5 }}>
                <AddIcon fontSize="small" />
              </Button>
            )}
          </Box>

          {activeFilterCount > 0 && (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
              {policyStatus !== 'ALL' && (
                <Chip label={`Status: ${LABOUR_STATUS_LABELS[policyStatus as LabourPolicyStatus]}`}
                  size="small" variant="outlined" color="primary" onDelete={() => setPolicyStatus('ALL')} />
              )}
              {labourPolicyType !== 'ALL' && (
                <Chip label={`Type: ${LABOUR_POLICY_TYPE_LABELS[labourPolicyType as LabourPolicyType]}`}
                  size="small" variant="outlined" color="secondary" onDelete={() => setLabourPolicyType('ALL')} />
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
        slotProps={{ paper: { sx: { borderRadius: 2.5, boxShadow: 8, mt: 0.75, width: 280, maxWidth: 'calc(100vw - 32px)' } } }}>
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
            value={policyStatus} onChange={(e) => setPolicyStatus(e.target.value as LabourPolicyStatus | 'ALL')}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{LABOUR_STATUS_LABELS[s]}</MenuItem>)}
          </TextField>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, letterSpacing: 0.4 }}>
            POLICY TYPE
          </Typography>
          <TextField select size="small" fullWidth sx={{ mb: 2 }}
            value={labourPolicyType} onChange={(e) => setLabourPolicyType(e.target.value as LabourPolicyType | 'ALL')}>
            <MenuItem value="ALL">All Types</MenuItem>
            {POLICY_TYPES.map((t) => <MenuItem key={t} value={t}>{LABOUR_POLICY_TYPE_LABELS[t]}</MenuItem>)}
          </TextField>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, letterSpacing: 0.4 }}>
            CUSTOMER TYPE
          </Typography>
          <TextField select size="small" fullWidth sx={{ mb: 2 }}
            value={customerType} onChange={(e) => setCustomerType(e.target.value as LabourCustomerType | 'ALL')}>
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
        <LabourInsuranceTable records={filtered} loading={loading} onDelete={setDeleteId} />
      </Paper>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Labour Insurance Record</DialogTitle>
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

export default function LabourRecordsPage() {
  return (
    <Suspense>
      <LabourRecordsContent />
    </Suspense>
  );
}

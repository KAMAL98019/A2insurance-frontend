'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Chip, TextField, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, CircularProgress, Grid, Autocomplete,
} from '@mui/material';
import TrackChangesIcon    from '@mui/icons-material/TrackChanges';
import AddIcon             from '@mui/icons-material/Add';
import EditIcon            from '@mui/icons-material/Edit';
import DeleteIcon          from '@mui/icons-material/Delete';
import PhoneIcon           from '@mui/icons-material/Phone';
import FolderIcon          from '@mui/icons-material/Folder';
import AutorenewIcon       from '@mui/icons-material/Autorenew';
import PaymentIcon         from '@mui/icons-material/Payment';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import CancelIcon          from '@mui/icons-material/Cancel';
import type { ChipProps }  from '@mui/material/Chip';
import { renewalsApi }     from '../../../../lib/api/renewals';
import { vehicleRecordsApi } from '../../../../lib/api/vehicle-records';
import { parseApiError }   from '../../../../lib/parse-error';
import { useToast }        from '../../../../providers/ToastProvider';
import type { VehicleRenewal, RenewalStatus, UpdateRenewalPayload } from '../../../../types/renewal.types';
import type { VehicleRecord } from '../../../../types/vehicle-record.types';

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusMeta {
  label: string;
  color: ChipProps['color'];
  icon: React.ReactNode;
  step: number;
}

const STATUS_META: Record<RenewalStatus, StatusMeta> = {
  CONTACTED:       { label: 'Contacted',       color: 'info',    icon: <PhoneIcon fontSize="inherit" />,       step: 0 },
  DOCS_COLLECTED:  { label: 'Docs Collected',  color: 'default', icon: <FolderIcon fontSize="inherit" />,      step: 1 },
  PROCESSING:      { label: 'Processing',      color: 'warning', icon: <AutorenewIcon fontSize="inherit" />,   step: 2 },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'warning', icon: <PaymentIcon fontSize="inherit" />,     step: 3 },
  RENEWED:         { label: 'Renewed',         color: 'success', icon: <CheckCircleIcon fontSize="inherit" />, step: 4 },
  CANCELLED:       { label: 'Cancelled',       color: 'error',   icon: <CancelIcon fontSize="inherit" />,      step: -1 },
};

const PIPELINE: RenewalStatus[] = [
  'CONTACTED', 'DOCS_COLLECTED', 'PROCESSING', 'PAYMENT_PENDING', 'RENEWED',
];

const ALL_STATUSES = Object.keys(STATUS_META) as RenewalStatus[];

// ─── Progress stepper ─────────────────────────────────────────────────────────

function RenewalProgress({ status }: { status: RenewalStatus }) {
  const currentStep = STATUS_META[status].step;
  const cancelled   = status === 'CANCELLED';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {PIPELINE.map((s, i) => {
        const done    = !cancelled && currentStep >= i;
        const current = !cancelled && currentStep === i;
        return (
          <Box key={s} sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={STATUS_META[s].label}>
              <Box sx={{
                width: 20, height: 20,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: cancelled ? 'grey.300' : done ? 'success.main' : 'grey.300',
                bgcolor: cancelled ? 'transparent' : done
                  ? (current ? 'warning.main' : 'success.main')
                  : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done ? 'white' : 'grey.400',
                boxShadow: current ? '0 0 0 3px rgba(237,108,2,0.25)' : 'none',
                transition: 'all 0.2s',
              }}>
                {done && <CheckCircleIcon sx={{ fontSize: 10 }} />}
              </Box>
            </Tooltip>
            {i < PIPELINE.length - 1 && (
              <Box sx={{
                width: 16, height: 2,
                bgcolor: !cancelled && currentStep > i ? 'success.main' : 'grey.200',
              }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, borderLeft: '4px solid', borderColor: color, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: { xs: '0.72rem', sm: '0.875rem' } }}>{label}</Typography>
    </Paper>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackRenewalsPage() {
  const { showError, showSuccess } = useToast();
  const [renewals,  setRenewals]  = useState<VehicleRenewal[]>([]);
  const [vehicles,  setVehicles]  = useState<VehicleRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState<RenewalStatus | 'ALL'>('ALL');
  const [search,    setSearch]    = useState('');

  // Start tracking dialog
  const [startOpen,    setStartOpen]    = useState(false);
  const [startVehicle, setStartVehicle] = useState<VehicleRecord | null>(null);
  const [startNotes,   setStartNotes]   = useState('');
  const [startStatus,  setStartStatus]  = useState<RenewalStatus>('CONTACTED');
  const [starting,     setStarting]     = useState(false);

  // Update status dialog
  const [updateTarget, setUpdateTarget] = useState<VehicleRenewal | null>(null);
  const [newStatus,    setNewStatus]    = useState<RenewalStatus>('CONTACTED');
  const [newNotes,     setNewNotes]     = useState('');
  const [updating,     setUpdating]     = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<VehicleRenewal | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const load = () => {
    setLoading(true);
    renewalsApi.getAll()
      .then(setRenewals)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    vehicleRecordsApi.getAll().then(setVehicles).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = renewals;
    if (statusFilter !== 'ALL') list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.vehicleRecord.vehicleNumber.toLowerCase().includes(q) ||
          r.vehicleRecord.ownerName.toLowerCase().includes(q) ||
          r.vehicleRecord.cellNumber.includes(q) ||
          (r.vehicleRecord.cellNumberAlt ?? '').includes(q),
      );
    }
    return list;
  }, [renewals, statusFilter, search]);

  const stats = useMemo(() => ({
    total:      renewals.length,
    inProgress: renewals.filter((r) => !['RENEWED', 'CANCELLED'].includes(r.status)).length,
    renewed:    renewals.filter((r) => r.status === 'RENEWED').length,
    cancelled:  renewals.filter((r) => r.status === 'CANCELLED').length,
  }), [renewals]);

  // ── Start tracking ──────────────────────────────────────────────────────────
  const openStart = () => {
    setStartVehicle(null); setStartNotes(''); setStartStatus('CONTACTED'); setStartOpen(true);
  };

  const handleStart = async () => {
    if (!startVehicle) return;
    setStarting(true);
    try {
      await renewalsApi.create({
        vehicleRecordId: startVehicle.id,
        status: startStatus,
        notes: startNotes.trim() || undefined,
      });
      showSuccess(`Renewal tracking started for ${startVehicle.vehicleNumber}`);
      setStartOpen(false);
      load();
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setStarting(false);
    }
  };

  // ── Update status ───────────────────────────────────────────────────────────
  const openUpdate = (renewal: VehicleRenewal) => {
    setUpdateTarget(renewal);
    setNewStatus(renewal.status);
    setNewNotes(renewal.notes ?? '');
  };

  const handleUpdate = async () => {
    if (!updateTarget) return;
    setUpdating(true);
    try {
      const payload: UpdateRenewalPayload = { status: newStatus };
      if (newNotes.trim()) payload.notes = newNotes.trim();
      await renewalsApi.update(updateTarget.id, payload);
      showSuccess('Renewal status updated');
      setUpdateTarget(null);
      load();
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await renewalsApi.remove(deleteTarget.id);
      showSuccess('Renewal tracking entry removed');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrackChangesIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Track Renewals</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage active renewal workflows and update statuses
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openStart} disableElevation>
          Start Tracking
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Total Tracked"  value={stats.total}      color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="In Progress"    value={stats.inProgress} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Renewed"        value={stats.renewed}    color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Cancelled"      value={stats.cancelled}  color="#d32f2f" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search vehicle, owner…"
            sx={{ flex: '1 1 180px', minWidth: 140 }}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
            <TextField
              select size="small" label="Status" sx={{ width: 180 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RenewalStatus | 'ALL')}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              {ALL_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  <Chip label={STATUS_META[s].label} size="small" color={STATUS_META[s].color} sx={{ cursor: 'pointer' }} />
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {filtered.length} of {renewals.length} tracked
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              {renewals.length === 0
                ? 'Nothing tracked yet. Click "Start Tracking" to begin.'
                : 'No records match the current filters.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['S.No','Vehicle','Owner','Category','Policy Expiry','Status','Progress','Notes','Started','Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r, idx) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>

                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {r.vehicleRecord.vehicleNumber}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.vehicleRecord.ownerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.vehicleRecord.cellNumber}</Typography>
                      </TableCell>

                      <TableCell>
                        <Chip label={r.vehicleRecord.category} size="small" />
                      </TableCell>

                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(r.vehicleRecord.policyExpiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={<Box sx={{ fontSize: 14, display: 'flex', ml: 0.25 }}>{meta.icon}</Box>}
                          label={meta.label}
                          size="small"
                          color={meta.color}
                          variant={r.status === 'RENEWED' ? 'filled' : 'outlined'}
                        />
                      </TableCell>

                      <TableCell>
                        <RenewalProgress status={r.status} />
                      </TableCell>

                      <TableCell sx={{ maxWidth: 160 }}>
                        {r.notes ? (
                          <Tooltip title={r.notes}>
                            <Typography variant="caption" color="text.secondary"
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {r.notes}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          <Tooltip title="Update Status">
                            <IconButton size="small" color="info" onClick={() => openUpdate(r)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(r)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Start Tracking Dialog ── */}
      <Dialog open={startOpen} onClose={() => !starting && setStartOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Start Renewal Tracking</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Autocomplete
            options={vehicles}
            getOptionLabel={(v) => `${v.vehicleNumber} — ${v.ownerName}`}
            value={startVehicle}
            onChange={(_, v) => setStartVehicle(v)}
            renderInput={(params) => (
              <TextField {...params} label="Vehicle *" size="small" placeholder="Search by vehicle no. or owner" />
            )}
          />
          <TextField
            select size="small" label="Initial Status" fullWidth
            value={startStatus} onChange={(e) => setStartStatus(e.target.value as RenewalStatus)}
          >
            {ALL_STATUSES.filter((s) => s !== 'RENEWED').map((s) => (
              <MenuItem key={s} value={s}>
                <Chip label={STATUS_META[s].label} size="small" color={STATUS_META[s].color} sx={{ cursor: 'pointer' }} />
              </MenuItem>
            ))}
          </TextField>
          <TextField
            multiline rows={3} size="small" label="Notes (optional)" fullWidth
            value={startNotes} onChange={(e) => setStartNotes(e.target.value)}
            placeholder="Any initial notes about this renewal…"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartOpen(false)} disabled={starting}>Cancel</Button>
          <Button
            variant="contained" disableElevation onClick={handleStart}
            disabled={starting || !startVehicle}
            startIcon={starting ? <CircularProgress size={14} /> : undefined}
          >
            Start Tracking
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Update Status Dialog ── */}
      <Dialog open={!!updateTarget} onClose={() => !updating && setUpdateTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Renewal Status</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          {updateTarget && (
            <Box sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {updateTarget.vehicleRecord.vehicleNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {updateTarget.vehicleRecord.ownerName}
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">Current</Typography>
                <Box>
                  <Chip
                    label={STATUS_META[updateTarget.status].label}
                    size="small"
                    color={STATUS_META[updateTarget.status].color}
                  />
                </Box>
              </Box>
            </Box>
          )}

          <TextField
            select size="small" label="New Status" fullWidth
            value={newStatus} onChange={(e) => setNewStatus(e.target.value as RenewalStatus)}
          >
            {ALL_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={STATUS_META[s].label} size="small" color={STATUS_META[s].color} sx={{ cursor: 'pointer' }} />
                  {updateTarget && s === updateTarget.status && (
                    <Typography variant="caption" color="text.disabled">(current)</Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1.5, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Progress preview
            </Typography>
            <RenewalProgress status={newStatus} />
          </Box>

          <TextField
            multiline rows={3} size="small" label="Notes" fullWidth
            value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Add a note about this status update…"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateTarget(null)} disabled={updating}>Cancel</Button>
          <Button
            variant="contained" disableElevation onClick={handleUpdate}
            disabled={updating || newStatus === updateTarget?.status}
            startIcon={updating ? <CircularProgress size={14} /> : undefined}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Remove Tracking Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Remove tracking for <strong>{deleteTarget?.vehicleRecord.vehicleNumber}</strong>?
            The vehicle record itself is not affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button
            color="error" variant="contained" disableElevation onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} /> : undefined}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

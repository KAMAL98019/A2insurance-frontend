'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Tooltip, Grid,
} from '@mui/material';
import AddIcon         from '@mui/icons-material/Add';
import PlaceIcon        from '@mui/icons-material/Place';
import BlockIcon        from '@mui/icons-material/Block';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import DeleteIcon       from '@mui/icons-material/Delete';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { locationsApi, Location } from '../../../../lib/api/locations';
import { parseApiError }          from '../../../../lib/parse-error';
import { useToast }               from '../../../../providers/ToastProvider';

function LocationsView() {
  const { showError, showSuccess } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading,   setLoading]   = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name,    setName]    = useState('');
  const [code,    setCode]    = useState('');
  const [address, setAddress] = useState('');
  const [city,    setCity]    = useState('');
  const [state,   setState]   = useState('');
  const [formError, setFormError] = useState('');
  const [saving,    setSaving]    = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<Location | null>(null);
  const [deactivating,     setDeactivating]     = useState(false);

  const [activatingId, setActivatingId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [deleteError,  setDeleteError]  = useState('');
  const [deleting,     setDeleting]     = useState(false);

  const load = () => {
    setLoading(true);
    locationsApi.getAll()
      .then(setLocations)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setName(''); setCode(''); setAddress(''); setCity(''); setState(''); setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return; }
    if (!code.trim())  { setFormError('Code is required'); return; }
    setSaving(true);
    try {
      await locationsApi.create({
        name: name.trim(), code: code.trim().toUpperCase(),
        address: address.trim() || undefined, city: city.trim() || undefined, state: state.trim() || undefined,
      });
      showSuccess(`Location "${name.trim()}" created`);
      setDialogOpen(false);
      load();
    } catch (e) {
      setFormError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await locationsApi.deactivate(deactivateTarget.id);
      showSuccess(`Location "${deactivateTarget.name}" deactivated`);
      setDeactivateTarget(null);
      load();
    } catch (err) {
      showError(parseApiError(err));
      setDeactivateTarget(null);
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async (loc: Location) => {
    setActivatingId(loc.id);
    try {
      await locationsApi.activate(loc.id);
      showSuccess(`Location "${loc.name}" reactivated`);
      load();
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setActivatingId(null);
    }
  };

  const openDelete = (loc: Location) => {
    setDeleteError('');
    setDeleteTarget(loc);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await locationsApi.remove(deleteTarget.id);
      showSuccess(`Location "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(parseApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlaceIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Locations</Typography>
            <Typography variant="body2" color="text.secondary">
              Branches / locations used for data isolation and Super Admin scoping
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd} disableElevation sx={{ flexShrink: 0 }}>
          Add Location
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : locations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No locations yet. Click "Add Location" to create one.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc.id} hover sx={{ opacity: loc.status === 'ACTIVE' ? 1 : 0.55 }}>
                    <TableCell sx={{ fontWeight: 600 }}>{loc.name}</TableCell>
                    <TableCell>
                      <Chip label={loc.code} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                    </TableCell>
                    <TableCell>{loc.city || '—'}</TableCell>
                    <TableCell>{loc.state || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={loc.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        size="small"
                        color={loc.status === 'ACTIVE' ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {loc.status === 'ACTIVE' ? (
                        <Tooltip title="Deactivate">
                          <IconButton size="small" color="warning" onClick={() => setDeactivateTarget(loc)}>
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Reactivate">
                          <span>
                            <IconButton
                              size="small" color="success"
                              onClick={() => handleActivate(loc)}
                              disabled={activatingId === loc.id}
                            >
                              {activatingId === loc.id
                                ? <CircularProgress size={16} />
                                : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete permanently">
                        <IconButton size="small" color="error" onClick={() => openDelete(loc)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Location</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                autoFocus fullWidth size="small" label="Location Name"
                placeholder="e.g. Erode Branch"
                value={name} onChange={(e) => { setName(e.target.value); setFormError(''); }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth size="small" label="Code"
                placeholder="e.g. ERD"
                value={code} onChange={(e) => { setCode(e.target.value); setFormError(''); }}
                slotProps={{ htmlInput: { maxLength: 30, style: { textTransform: 'uppercase' } } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="State (optional)" value={state} onChange={(e) => setState(e.target.value)} />
            </Grid>
          </Grid>
          {formError && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1.5 }}>{formError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} /> : undefined}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Confirmation */}
      <Dialog open={!!deactivateTarget} onClose={() => !deactivating && setDeactivateTarget(null)}>
        <DialogTitle>Deactivate Location</DialogTitle>
        <DialogContent>
          <Typography>
            Deactivate <strong>{deactivateTarget?.name}</strong>? Users assigned here keep their access; the location
            will no longer be selectable for new assignments. You can reactivate it anytime.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateTarget(null)} disabled={deactivating}>Cancel</Button>
          <Button color="warning" variant="contained" disableElevation onClick={handleDeactivate} disabled={deactivating}
            startIcon={deactivating ? <CircularProgress size={14} /> : undefined}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete Location Permanently</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Permanently delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Blocked automatically if this location still has vehicle/health/fire/labour records or assigned users —
            deactivate it instead, or reassign/remove that data first.
          </Typography>
          {deleteError && (
            <Typography variant="body2" color="error" sx={{ mt: 1.5, p: 1.5, bgcolor: 'error.50', borderRadius: 1 }}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" disableElevation onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} /> : undefined}>
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function LocationsPage() {
  return (
    <ProtectedRoute allowedRoles={['MASTER_ADMIN']}>
      <LocationsView />
    </ProtectedRoute>
  );
}

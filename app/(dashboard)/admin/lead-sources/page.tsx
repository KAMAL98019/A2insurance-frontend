'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Tooltip, Switch, FormControlLabel,
} from '@mui/material';
import AddIcon          from '@mui/icons-material/Add';
import EditIcon         from '@mui/icons-material/Edit';
import DeleteIcon       from '@mui/icons-material/Delete';
import TuneIcon         from '@mui/icons-material/Tune';
import { leadSourcesApi, LeadSource } from '../../../../lib/api/lead-sources';
import { parseApiError }              from '../../../../lib/parse-error';
import { useToast }                   from '../../../../providers/ToastProvider';

export default function LeadSourcesPage() {
  const { showError, showSuccess } = useToast();
  const [sources,  setSources]  = useState<LeadSource[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<LeadSource | null>(null);
  const [nameInput,  setNameInput]  = useState('');
  const [isActive,   setIsActive]   = useState(true);
  const [nameError,  setNameError]  = useState('');
  const [saving,     setSaving]     = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeadSource | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const load = () => {
    setLoading(true);
    leadSourcesApi.getAll()
      .then(setSources)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null); setNameInput(''); setIsActive(true); setNameError(''); setDialogOpen(true);
  };

  const openEdit = (src: LeadSource) => {
    setEditing(src); setNameInput(src.name); setIsActive(src.isActive); setNameError(''); setDialogOpen(true);
  };

  const validate = (v: string) => {
    if (!v.trim())    return 'Name is required';
    if (v.length > 100) return 'Max 100 characters';
    return '';
  };

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    const err = validate(trimmed);
    if (err) { setNameError(err); return; }
    setSaving(true);
    try {
      if (editing) {
        await leadSourcesApi.update(editing.id, { name: trimmed, isActive });
        showSuccess(`Lead source updated to "${trimmed}"`);
      } else {
        await leadSourcesApi.create({ name: trimmed, isActive });
        showSuccess(`Lead source "${trimmed}" created`);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setNameError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await leadSourcesApi.remove(deleteTarget.id);
      showSuccess(`Lead source "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      showError(parseApiError(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (src: LeadSource) => {
    try {
      const updated = await leadSourcesApi.update(src.id, { isActive: !src.isActive });
      setSources((prev) => prev.map((s) => s.id === src.id ? updated : s));
    } catch (err) {
      showError(parseApiError(err));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Lead Sources</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage lead source options shown in all insurance forms
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd} disableElevation sx={{ flexShrink: 0 }}>
          Add Lead Source
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : sources.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No lead sources yet. Click "Add Lead Source" to create one.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sources.map((src, idx) => (
                  <TableRow key={src.id} hover sx={{ opacity: src.isActive ? 1 : 0.55 }}>
                    <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{src.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={src.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={src.isActive ? 'success' : 'default'}
                        variant="outlined"
                        onClick={() => toggleActive(src)}
                        sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{new Date(src.createdAt).toLocaleDateString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{new Date(src.updatedAt).toLocaleDateString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="info" onClick={() => openEdit(src)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(src)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit Lead Source' : 'Add Lead Source'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth size="small" sx={{ mt: 1 }}
            label="Lead Source Name"
            placeholder="e.g. Referral, Walk-in, Social Media, Agent"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
            error={!!nameError}
            helperText={nameError}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <FormControlLabel
            sx={{ mt: 1.5 }}
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show in dropdown ({isActive ? 'Active' : 'Inactive'})</Typography>}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} /> : undefined}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete Lead Source</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.name}</strong>? Existing records using this value will keep the text as-is.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" disableElevation onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} /> : undefined}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

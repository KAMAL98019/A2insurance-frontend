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
import BusinessIcon     from '@mui/icons-material/Business';
import { insuranceCompaniesApi, InsuranceCompany } from '../../../../lib/api/insurance-companies';
import { parseApiError }                           from '../../../../lib/parse-error';
import { useToast }                                from '../../../../providers/ToastProvider';

export default function InsuranceCompaniesPage() {
  const { showError, showSuccess } = useToast();
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading,   setLoading]   = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<InsuranceCompany | null>(null);
  const [nameInput,  setNameInput]  = useState('');
  const [isActive,   setIsActive]   = useState(true);
  const [nameError,  setNameError]  = useState('');
  const [saving,     setSaving]     = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<InsuranceCompany | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const load = () => {
    setLoading(true);
    insuranceCompaniesApi.getAll()
      .then(setCompanies)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null); setNameInput(''); setIsActive(true); setNameError(''); setDialogOpen(true);
  };

  const openEdit = (c: InsuranceCompany) => {
    setEditing(c); setNameInput(c.name); setIsActive(c.isActive); setNameError(''); setDialogOpen(true);
  };

  const validate = (v: string) => {
    if (!v.trim())      return 'Name is required';
    if (v.length > 150) return 'Max 150 characters';
    return '';
  };

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    const err = validate(trimmed);
    if (err) { setNameError(err); return; }
    setSaving(true);
    try {
      if (editing) {
        await insuranceCompaniesApi.update(editing.id, { name: trimmed, isActive });
        showSuccess(`Insurance company updated to "${trimmed}"`);
      } else {
        await insuranceCompaniesApi.create({ name: trimmed, isActive });
        showSuccess(`Insurance company "${trimmed}" created`);
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
      await insuranceCompaniesApi.remove(deleteTarget.id);
      showSuccess(`Insurance company "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      showError(parseApiError(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (c: InsuranceCompany) => {
    try {
      const updated = await insuranceCompaniesApi.update(c.id, { isActive: !c.isActive });
      setCompanies((prev) => prev.map((x) => x.id === c.id ? updated : x));
    } catch (err) {
      showError(parseApiError(err));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Insurance Companies</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage the insurance company options shown in all insurance forms
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd} disableElevation sx={{ flexShrink: 0 }}>
          Add Insurance Company
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : companies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No insurance companies yet. Click "Add Insurance Company" to create one.</Typography>
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
                {companies.map((c, idx) => (
                  <TableRow key={c.id} hover sx={{ opacity: c.isActive ? 1 : 0.55 }}>
                    <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={c.isActive ? 'success' : 'default'}
                        variant="outlined"
                        onClick={() => toggleActive(c)}
                        sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{new Date(c.createdAt).toLocaleDateString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{new Date(c.updatedAt).toLocaleDateString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="info" onClick={() => openEdit(c)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(c)}><DeleteIcon fontSize="small" /></IconButton>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit Insurance Company' : 'Add Insurance Company'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth size="small" sx={{ mt: 1 }}
            label="Insurance Company Name"
            placeholder="e.g. HDFC ERGO, ICICI Lombard, Bajaj Allianz"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
            error={!!nameError}
            helperText={nameError}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            slotProps={{ htmlInput: { maxLength: 150, autoComplete: 'off' } }}
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
        <DialogTitle>Delete Insurance Company</DialogTitle>
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

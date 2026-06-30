'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Tooltip,
} from '@mui/material';
import AddIcon      from '@mui/icons-material/Add';
import EditIcon     from '@mui/icons-material/Edit';
import DeleteIcon   from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import { categoriesApi } from '../../../../lib/api/categories';
import { parseApiError }  from '../../../../lib/parse-error';
import { useToast }       from '../../../../providers/ToastProvider';
import type { VehicleCategory } from '../../../../types/vehicle-record.types';

export default function CategoriesPage() {
  const { showError, showSuccess } = useToast();
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Add/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<VehicleCategory | null>(null);
  const [nameInput,  setNameInput]  = useState('');
  const [nameError,  setNameError]  = useState('');
  const [saving,     setSaving]     = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<VehicleCategory | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const load = () => {
    setLoading(true);
    categoriesApi.getAll()
      .then(setCategories)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null); setNameInput(''); setNameError(''); setDialogOpen(true);
  };

  const openEdit = (cat: VehicleCategory) => {
    setEditing(cat); setNameInput(cat.name); setNameError(''); setDialogOpen(true);
  };

  const validate = (v: string) => {
    if (!v.trim())               return 'Name is required';
    if (!/^[A-Z0-9_]+$/.test(v)) return 'Only uppercase letters, digits, underscores';
    if (v.length > 50)           return 'Max 50 characters';
    return '';
  };

  const handleSave = async () => {
    const trimmed = nameInput.trim().toUpperCase();
    const err = validate(trimmed);
    if (err) { setNameError(err); return; }
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, trimmed);
        showSuccess(`Category updated to "${trimmed}"`);
      } else {
        await categoriesApi.create(trimmed);
        showSuccess(`Category "${trimmed}" created`);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      const parsed = parseApiError(e);
      setNameError(parsed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoriesApi.remove(deleteTarget.id);
      showSuccess(`Category "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      showError(parseApiError(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Vehicle Categories</Typography>
            <Typography variant="body2" color="text.secondary">Manage categories used in vehicle records</Typography>
          </Box>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd} disableElevation sx={{ flexShrink: 0 }}>
          Add Category
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : categories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No categories yet. Click "Add Category" to create one.</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat, idx) => (
                  <TableRow key={cat.id} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                    <TableCell><Chip label={cat.name} size="small" /></TableCell>
                    <TableCell><Typography variant="caption">{new Date(cat.createdAt).toLocaleDateString('en-IN')}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{new Date(cat.updatedAt).toLocaleDateString('en-IN')}</Typography></TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="info" onClick={() => openEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(cat)}><DeleteIcon fontSize="small" /></IconButton>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use uppercase letters only (e.g. TW, CAR, COMMERCIAL, TRUCK)
          </Typography>
          <TextField
            autoFocus fullWidth size="small"
            label="Category Name"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value.toUpperCase()); setNameError(''); }}
            error={!!nameError}
            helperText={nameError || 'Uppercase letters, digits, underscores only'}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained" disableElevation onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} /> : undefined}
          >
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.name}</strong>? Existing vehicle records using this category will keep the value as-is.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button
            color="error" variant="contained" disableElevation onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} /> : undefined}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

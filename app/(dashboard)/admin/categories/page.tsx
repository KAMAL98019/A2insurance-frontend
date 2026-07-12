'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Tooltip, List, ListItem,
} from '@mui/material';
import AddIcon         from '@mui/icons-material/Add';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import CategoryIcon    from '@mui/icons-material/Category';
import { categoriesApi, flattenCategories } from '../../../../lib/api/categories';
import { parseApiError } from '../../../../lib/parse-error';
import { useToast }      from '../../../../providers/ToastProvider';
import type { VehicleCategory } from '../../../../types/vehicle-record.types';

export default function CategoriesPage() {
  const { showError, showSuccess } = useToast();
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading,    setLoading]    = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<VehicleCategory | null>(null);
  const [nameInput,  setNameInput]  = useState('');
  const [nameError,  setNameError]  = useState('');
  const [saving,     setSaving]     = useState(false);

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

  const flatList = flattenCategories(categories).sort((a, b) => a.name.localeCompare(b.name));

  const openAdd = () => {
    setEditing(null); setNameInput(''); setNameError(''); setDialogOpen(true);
  };
  const openEdit = (cat: VehicleCategory) => {
    setEditing(cat); setNameInput(cat.name); setNameError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmed = nameInput.trim().toUpperCase();
    if (!trimmed)                      { setNameError('Name is required'); return; }
    if (!/^[A-Z0-9_]+$/.test(trimmed)) { setNameError('Uppercase letters, digits, underscores only'); return; }
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, trimmed);
        showSuccess(`"${trimmed}" updated`);
      } else {
        await categoriesApi.create(trimmed);
        showSuccess(`"${trimmed}" created`);
      }
      setDialogOpen(false);
      load();
    } catch (e) { setNameError(parseApiError(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoriesApi.remove(deleteTarget.id);
      showSuccess(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null); load();
    } catch (err) { showError(parseApiError(err)); setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Vehicle Categories</Typography>
            <Typography variant="body2" color="text.secondary">All categories available when adding a vehicle</Typography>
          </Box>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd} disableElevation>
          Add Category
        </Button>
      </Box>

      {/* Flat list */}
      <Paper sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : flatList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CategoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No categories yet. Click "Add Category" to start.</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {flatList.map((cat, i) => (
              <ListItem
                key={cat.id}
                sx={{ borderBottom: i < flatList.length - 1 ? '1px solid' : 'none', borderColor: 'divider', py: 1.25 }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="info" onClick={() => openEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(cat)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <Typography sx={{ fontWeight: 600 }}>{cat.name}</Typography>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            autoFocus fullWidth size="small"
            label="Category Name"
            placeholder="e.g. CAR, LORRY, TW"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value.toUpperCase()); setNameError(''); }}
            error={!!nameError}
            helperText={nameError || 'Uppercase letters, digits, underscores only'}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            slotProps={{ htmlInput: { maxLength: 50, autoComplete: 'off' } }}
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
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.name}</strong>? Vehicle records using this value will keep it as-is.
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

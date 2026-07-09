'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Tooltip,
} from '@mui/material';
import AddIcon         from '@mui/icons-material/Add';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { categoriesApi } from '../../../../lib/api/categories';
import { parseApiError } from '../../../../lib/parse-error';
import { useToast }      from '../../../../providers/ToastProvider';
import type { VehicleCategory } from '../../../../types/vehicle-record.types';

// ── Node components ────────────────────────────────────────────────────────────

function ParentNode({ cat, onAdd, onEdit, onDelete }: {
  cat: VehicleCategory;
  onAdd: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      bgcolor: '#1a2980', color: '#fff',
      px: 2, py: 0.9, borderRadius: 2,
      boxShadow: '0 2px 8px rgba(26,41,128,0.25)',
    }}>
      <AccountTreeIcon sx={{ fontSize: 15, opacity: 0.8 }} />
      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', letterSpacing: 0.5, mx: 0.5 }}>
        {cat.name}
      </Typography>
      <Tooltip title="Add child"><IconButton size="small" onClick={onAdd} sx={{ color: 'rgba(255,255,255,0.75)', p: 0.4, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}><AddIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
      <Tooltip title="Edit"><IconButton size="small" onClick={onEdit} sx={{ color: 'rgba(255,255,255,0.75)', p: 0.4, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}><EditIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
      <Tooltip title="Delete"><IconButton size="small" onClick={onDelete} sx={{ color: 'rgba(255,255,255,0.55)', p: 0.4, '&:hover': { color: '#ffcdd2', bgcolor: 'rgba(255,255,255,0.1)' } }}><DeleteIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
    </Box>
  );
}

function ChildNode({ cat, onEdit, onDelete }: {
  cat: VehicleCategory; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1.75, py: 0.75, borderRadius: 1.5,
      border: '1.5px solid #c8d0e7', bgcolor: '#f4f6fb',
    }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a2980' }}>{cat.name}</Typography>
      <Tooltip title="Edit"><IconButton size="small" color="info" onClick={onEdit} sx={{ p: 0.3 }}><EditIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={onDelete} sx={{ p: 0.3 }}><DeleteIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { showError, showSuccess } = useToast();
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading,    setLoading]    = useState(true);

  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editing,       setEditing]       = useState<VehicleCategory | null>(null);
  const [nameInput,     setNameInput]     = useState('');
  const [parentIdInput, setParentIdInput] = useState<number | ''>('');
  const [nameError,     setNameError]     = useState('');
  const [saving,        setSaving]        = useState(false);

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

  const openAdd = (pid?: number) => {
    setEditing(null); setNameInput(''); setParentIdInput(pid ?? ''); setNameError(''); setDialogOpen(true);
  };
  const openEdit = (cat: VehicleCategory) => {
    setEditing(cat); setNameInput(cat.name); setParentIdInput(cat.parentId ?? ''); setNameError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmed = nameInput.trim().toUpperCase();
    if (!trimmed)                { setNameError('Name is required'); return; }
    if (!/^[A-Z0-9_]+$/.test(trimmed)) { setNameError('Uppercase letters, digits, underscores only'); return; }
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, trimmed);
        showSuccess(`"${trimmed}" updated`);
      } else {
        await categoriesApi.create(trimmed, parentIdInput !== '' ? (parentIdInput as number) : undefined);
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
          <AccountTreeIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Vehicle Categories</Typography>
            <Typography variant="body2" color="text.secondary">Parent groups and their child categories</Typography>
          </Box>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd()} disableElevation>
          Add Parent Group
        </Button>
      </Box>

      {/* Tree view */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : categories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <AccountTreeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No categories yet. Click "Add Parent Group" to start.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {categories.map((parent) => {
              const children = parent.children ?? [];
              return (
                <Box key={parent.id}>
                  {/* ── Parent node ── */}
                  <ParentNode
                    cat={parent}
                    onAdd={() => openAdd(parent.id)}
                    onEdit={() => openEdit(parent)}
                    onDelete={() => setDeleteTarget(parent)}
                  />

                  {/* ── Children connected by lines ── */}
                  {children.length > 0 ? (
                    <Box sx={{
                      ml: 2.5,                         // indent to ~center of parent node
                      mt: 0,
                      pl: 2.5,                         // horizontal branch width
                      pt: 1,
                      pb: 0.5,
                      borderLeft: '2px solid #c8d0e7', // vertical connector line
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                    }}>
                      {children.map((child) => (
                        <Box
                          key={child.id}
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            // horizontal branch line from vertical to node
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: -20,            // = pl: 2.5 (20px)
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 20,
                              height: 2,
                              backgroundColor: '#c8d0e7',
                            },
                          }}
                        >
                          <ChildNode
                            cat={child}
                            onEdit={() => openEdit(child)}
                            onDelete={() => setDeleteTarget(child)}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    /* Empty — show a dashed "add child" hint */
                    <Box sx={{
                      ml: 2.5, mt: 0, pl: 2.5, pt: 1, pb: 0.5,
                      borderLeft: '2px dashed #dde2ef',
                      display: 'flex', flexDirection: 'column', gap: 1,
                    }}>
                      <Box
                        onClick={() => openAdd(parent.id)}
                        sx={{
                          position: 'relative',
                          display: 'inline-flex', alignItems: 'center', gap: 0.5,
                          cursor: 'pointer',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: -20, top: '50%', transform: 'translateY(-50%)',
                            width: 20, height: 2, backgroundColor: '#dde2ef',
                          },
                          '&:hover .hint-text': { color: 'primary.main' },
                        }}
                      >
                        <Typography className="hint-text" variant="caption" color="text.disabled"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.25, transition: 'color 0.2s' }}>
                          <AddIcon sx={{ fontSize: 12 }} /> Add child category
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit Category' : parentIdInput !== '' ? 'Add Child Category' : 'Add Parent Group'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            autoFocus fullWidth size="small"
            label={parentIdInput !== '' ? 'Child Category Name' : 'Group Name'}
            placeholder={parentIdInput !== '' ? 'e.g. CAR, LORRY, TW' : 'e.g. COMMERCIAL, TWO_WHEELER'}
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
            Delete <strong>{deleteTarget?.name}</strong>?
            {(deleteTarget?.children?.length ?? 0) > 0
              ? ' Remove all child categories first.'
              : ' Vehicle records using this value will keep it as-is.'}
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

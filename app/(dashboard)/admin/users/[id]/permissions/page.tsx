'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Button, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, Checkbox,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon      from '@mui/icons-material/Tune';
import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';
import { permissionsApi } from '../../../../../../lib/api/permissions';
import type { ModulePermission } from '../../../../../../types/auth.types';
import { parseApiError } from '../../../../../../lib/parse-error';
import { useToast }      from '../../../../../../providers/ToastProvider';

// Renewals aren't separate menu items — they're accessed from within their
// parent record, so they share that module's permission grant instead of
// needing their own row here.
const MODULES = [
  { key: 'vehicle-records',  label: 'Vehicle Records' },
  { key: 'health-insurance', label: 'Health Insurance' },
  { key: 'fire-insurance',   label: 'Fire Insurance' },
  { key: 'labour-insurance', label: 'Labour Insurance' },
];

const ACTIONS: { key: keyof Omit<ModulePermission, 'id' | 'adminUserId' | 'moduleName'>; label: string }[] = [
  { key: 'canView',   label: 'View' },
  { key: 'canCreate', label: 'Create' },
  { key: 'canUpdate', label: 'Update' },
  { key: 'canDelete', label: 'Delete' },
  { key: 'canExport', label: 'Export' },
];

type Matrix = Record<string, Omit<ModulePermission, 'id' | 'adminUserId'>>;

function blankMatrix(): Matrix {
  const m: Matrix = {};
  for (const mod of MODULES) {
    m[mod.key] = { moduleName: mod.key, canView: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false };
  }
  return m;
}

function PermissionMatrixView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const adminUserId = Number(id);

  const [matrix, setMatrix]   = useState<Matrix>(blankMatrix());
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    permissionsApi.getForUser(adminUserId)
      .then((rows) => {
        const m = blankMatrix();
        for (const r of rows) {
          m[r.moduleName] = { moduleName: r.moduleName, canView: r.canView, canCreate: r.canCreate, canUpdate: r.canUpdate, canDelete: r.canDelete, canExport: r.canExport };
        }
        setMatrix(m);
      })
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [adminUserId]);

  const toggle = (moduleKey: string, action: keyof Omit<ModulePermission, 'id' | 'adminUserId' | 'moduleName'>) => {
    setMatrix((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [action]: !prev[moduleKey][action] },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await permissionsApi.setMany(adminUserId, Object.values(matrix));
      showSuccess('Permissions updated');
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={() => router.push('/admin/users')}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <TuneIcon color="primary" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Module Permissions</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure exactly what this Admin User can view, create, update, delete, and export per module.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Module</TableCell>
                  {ACTIONS.map((a) => (
                    <TableCell key={a.key} align="center" sx={{ fontWeight: 700 }}>{a.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {MODULES.map((mod) => (
                  <TableRow key={mod.key} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{mod.label}</TableCell>
                    {ACTIONS.map((a) => (
                      <TableCell key={a.key} align="center">
                        <Checkbox
                          size="small"
                          checked={matrix[mod.key][a.key]}
                          onChange={() => toggle(mod.key, a.key)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <Button
        variant="contained" size="large" disableElevation
        onClick={handleSave}
        disabled={saving || loading}
        sx={{ mt: 3 }}
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {saving ? 'Saving…' : 'Save Permissions'}
      </Button>
    </Box>
  );
}

export default function PermissionMatrixPage() {
  return (
    <ProtectedRoute allowedRoles={['MASTER_ADMIN', 'SUPER_ADMIN']}>
      <PermissionMatrixView />
    </ProtectedRoute>
  );
}

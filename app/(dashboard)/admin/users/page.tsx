'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Tooltip, Grid, Select, MenuItem,
  InputLabel, FormControl, Menu,
} from '@mui/material';
import AddIcon        from '@mui/icons-material/Add';
import PeopleIcon     from '@mui/icons-material/People';
import MoreVertIcon   from '@mui/icons-material/MoreVert';
import KeyIcon        from '@mui/icons-material/Key';
import TuneIcon       from '@mui/icons-material/Tune';
import NextLink from 'next/link';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useAccessibleLocations } from '../../../../hooks/useAccessibleLocations';
import { useAllLocations } from '../../../../hooks/useAllLocations';
import { usersApi } from '../../../../lib/api/users';
import type { AuthUser, UserStatus } from '../../../../types/auth.types';
import { parseApiError } from '../../../../lib/parse-error';
import { useToast }      from '../../../../providers/ToastProvider';

const STATUS_COLOR: Record<UserStatus, 'success' | 'default' | 'error'> = {
  ACTIVE: 'success', INACTIVE: 'default', BLOCKED: 'error',
};

function UsersView() {
  const { showError, showSuccess } = useToast();
  const me = useCurrentUser();
  const { locations } = useAccessibleLocations(); // active-only, for the create-user dropdowns
  const { locations: allLocations } = useAllLocations(); // any status, for name lookups in the table

  const [users,   setUsers]   = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [createSuperOpen, setCreateSuperOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [locationId, setLocationId] = useState<number | ''>('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<AuthUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AuthUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const isMaster = me?.role === 'MASTER_ADMIN';

  const locationName = (id: number | null | undefined) => {
    if (!id) return '—';
    const loc = allLocations.find((l) => l.id === id);
    if (!loc) return `#${id}`;
    return loc.status === 'INACTIVE' ? `${loc.name} (inactive)` : loc.name;
  };

  const load = () => {
    setLoading(true);
    (isMaster ? usersApi.listAll() : usersApi.listMine())
      .then(setUsers)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (me) load(); }, [me]);

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setPassword(''); setLocationId(''); setSelectedLocationIds([]);
    setFormError('');
  };

  const openCreateSuper = () => { resetForm(); setCreateSuperOpen(true); };
  const openCreateAdmin = () => { resetForm(); setCreateAdminOpen(true); };

  const handleCreateSuperAdmin = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setFormError('All fields are required'); return;
    }
    setSaving(true);
    try {
      await usersApi.createSuperAdmin({
        name: name.trim(), email: email.trim(), phoneNumber: phone.trim(), password,
        locationIds: selectedLocationIds,
      });
      showSuccess(`Super Admin "${name.trim()}" created`);
      setCreateSuperOpen(false);
      load();
    } catch (e) {
      setFormError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAdminUser = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !locationId) {
      setFormError('All fields including location are required'); return;
    }
    setSaving(true);
    try {
      await usersApi.createAdminUser({
        name: name.trim(), email: email.trim(), phoneNumber: phone.trim(), password,
        locationId: Number(locationId),
      });
      showSuccess(`Admin User "${name.trim()}" created`);
      setCreateAdminOpen(false);
      load();
    } catch (e) {
      setFormError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, user: AuthUser) => {
    setMenuAnchor(e.currentTarget); setMenuTarget(user);
  };
  const closeMenu = () => { setMenuAnchor(null); setMenuTarget(null); };

  const handleSetStatus = async (status: UserStatus) => {
    if (!menuTarget) return;
    try {
      await usersApi.setStatus(menuTarget.id, status);
      showSuccess(`${menuTarget.name} is now ${status.toLowerCase()}`);
      load();
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      closeMenu();
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword.trim()) return;
    setSaving(true);
    try {
      await usersApi.resetPassword(resetTarget.id, newPassword);
      showSuccess(`Password reset for ${resetTarget.name}`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Users</Typography>
            <Typography variant="body2" color="text.secondary">
              {isMaster ? 'All Super Admins and Admin Users across the system' : 'Admin Users you have created'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {isMaster && (
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openCreateSuper} disableElevation>
              Add Super Admin
            </Button>
          )}
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateAdmin} disableElevation>
            Add Admin User
          </Button>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No users yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover sx={{ opacity: u.status === 'ACTIVE' ? 1 : 0.6 }}>
                    <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.role.replace('_', ' ')}
                        size="small"
                        color={u.role === 'MASTER_ADMIN' ? 'primary' : u.role === 'SUPER_ADMIN' ? 'secondary' : 'default'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {u.role === 'ADMIN_USER' ? (
                        <Typography variant="body2">{locationName(u.primaryLocationId)}</Typography>
                      ) : (
                        <Tooltip title="Full oversight — all locations">
                          <Typography variant="caption" color="text.secondary">All</Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={u.status} size="small" color={STATUS_COLOR[u.status]} variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {u.role === 'ADMIN_USER' && (
                        <Tooltip title="Manage permissions">
                          <IconButton size="small" component={NextLink} href={`/admin/users/${u.id}/permissions`}>
                            <TuneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Reset password">
                        <IconButton size="small" onClick={() => { setResetTarget(u); setNewPassword(''); }}>
                          <KeyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {u.id !== me?.id && (
                        <Tooltip title="More">
                          <IconButton size="small" onClick={(e) => openMenu(e, u)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Status menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => handleSetStatus('ACTIVE')}>Activate</MenuItem>
        <MenuItem onClick={() => handleSetStatus('INACTIVE')}>Deactivate</MenuItem>
        <MenuItem onClick={() => handleSetStatus('BLOCKED')} sx={{ color: 'error.main' }}>Block</MenuItem>
      </Menu>

      {/* Create Super Admin */}
      <Dialog open={createSuperOpen} onClose={() => !saving && setCreateSuperOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Super Admin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField autoFocus fullWidth size="small" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Assign Locations</InputLabel>
                <Select
                  multiple
                  label="Assign Locations"
                  value={selectedLocationIds}
                  onChange={(e) => setSelectedLocationIds(
                    typeof e.target.value === 'string' ? [] : e.target.value as number[],
                  )}
                  renderValue={(selected) =>
                    locations.filter((l) => selected.includes(l.id)).map((l) => l.name).join(', ')
                  }
                >
                  {locations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.name} ({l.code})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {formError && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1.5 }}>{formError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSuperOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={handleCreateSuperAdmin} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} /> : undefined}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Admin User */}
      <Dialog open={createAdminOpen} onClose={() => !saving && setCreateAdminOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Admin User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField autoFocus fullWidth size="small" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select label="Location" value={locationId} onChange={(e) => setLocationId(e.target.value as number)}>
                  {locations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.name} ({l.code})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Module permissions can be configured after creation from the permission matrix.
          </Typography>
          {formError && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>{formError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAdminOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={handleCreateAdminUser} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} /> : undefined}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={!!resetTarget} onClose={() => !saving && setResetTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Set a new password for <strong>{resetTarget?.name}</strong>.
          </Typography>
          <TextField
            autoFocus fullWidth size="small" label="New Password" type="password"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTarget(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={handleResetPassword} disabled={saving || !newPassword.trim()}
            startIcon={saving ? <CircularProgress size={14} /> : undefined}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={['MASTER_ADMIN', 'SUPER_ADMIN']}>
      <UsersView />
    </ProtectedRoute>
  );
}

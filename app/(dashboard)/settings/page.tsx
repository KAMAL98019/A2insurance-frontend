'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Switch, Radio,
  FormControlLabel, Divider, Chip, CircularProgress, Alert,
  InputAdornment, IconButton, Tooltip, Menu, MenuItem, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import WhatsAppIcon         from '@mui/icons-material/WhatsApp';
import SettingsIcon         from '@mui/icons-material/Settings';
import NotificationsIcon    from '@mui/icons-material/Notifications';
import CheckCircleIcon      from '@mui/icons-material/CheckCircle';
import CancelIcon           from '@mui/icons-material/Cancel';
import HourglassTopIcon     from '@mui/icons-material/HourglassTop';
import SendIcon             from '@mui/icons-material/Send';
import HistoryIcon          from '@mui/icons-material/History';
import PhoneAndroidIcon     from '@mui/icons-material/PhoneAndroid';
import FileDownloadIcon     from '@mui/icons-material/FileDownload';
import ChevronLeftIcon      from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon     from '@mui/icons-material/ChevronRight';
import { exportLogsToExcel, exportLogsToCSV } from '../../../lib/export';
import { notificationsApi } from '../../../lib/api/notifications';
import { useToast }         from '../../../providers/ToastProvider';
import { parseApiError }    from '../../../lib/parse-error';
import type { NotificationSettings, NotificationLog, NotifStats } from '../../../types/notification.types';

const TYPE_LABEL: Record<string, string> = {
  EXPIRY_30:    '30-Day Alert',
  EXPIRY_15:    '15-Day Alert',
  EXPIRY_7:     '7-Day Alert',
  EXPIRY_TODAY: 'Expires Today',
  EXPIRED:      'Expired Alert',
  RENEWED:      'Renewal Alert',
  MANUAL:       'Manual',
};

const TYPE_COLOR: Record<string, 'info' | 'warning' | 'error' | 'success' | 'default'> = {
  EXPIRY_30:    'info',
  EXPIRY_15:    'warning',
  EXPIRY_7:     'error',
  EXPIRY_TODAY: 'error',
  EXPIRED:      'error',
  RENEWED:      'success',
  MANUAL:       'default',
};

function StatusChip({ status }: { status: string }) {
  const map = {
    SENT:    { icon: <CheckCircleIcon sx={{ fontSize: 14 }} />, color: 'success' as const, label: 'Sent' },
    FAILED:  { icon: <CancelIcon sx={{ fontSize: 14 }} />,      color: 'error' as const,   label: 'Failed' },
    PENDING: { icon: <HourglassTopIcon sx={{ fontSize: 14 }} />, color: 'warning' as const, label: 'Pending' },
  };
  const cfg = map[status as keyof typeof map] ?? map.PENDING;
  return <Chip icon={cfg.icon} label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
}

export default function SettingsPage() {
  const { showSuccess, showError } = useToast();

  const PAGE_SIZE = 10;

  const [logs,        setLogs]        = useState<NotificationLog[]>([]);
  const [stats,       setStats]       = useState<NotifStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [testPhone,   setTestPhone]   = useState('');
  const [waConnected,  setWaConnected]  = useState(false);
  const [qrDataUrl,    setQrDataUrl]    = useState<string | null>(null);
  const [qrRefreshing, setQrRefreshing] = useState(false);
  const [logPage,      setLogPage]      = useState(1);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  const [form, setForm] = useState({
    firstAlertDays:  30,
    secondAlertDays: 15,
    finalAlertDays:  7,
    schedulerHour:   8,
    enableWhatsApp:  true,
    enableEmail:     false,
    enableSms:       false,
    language:        'english',
    contactName:     '',
    contactPhone:    '',
    contactAddress:  '',
  });

  useEffect(() => {
    Promise.all([
      notificationsApi.getSettings(),
      notificationsApi.getLogs(500),
      notificationsApi.getStats(),
      notificationsApi.getWhatsAppStatus(),
    ])
      .then(([s, l, st, wa]) => {
        setLogs(l);
        setStats(st);
        setWaConnected(wa.connected);
        setForm({
          firstAlertDays:  s.firstAlertDays,
          secondAlertDays: s.secondAlertDays,
          finalAlertDays:  s.finalAlertDays,
          enableWhatsApp:  s.enableWhatsApp,
          enableEmail:     s.enableEmail,
          enableSms:       s.enableSms,
          schedulerHour:   s.schedulerHour   ?? 8,
          language:        s.language        ?? 'english',
          contactName:     s.contactName     ?? '',
          contactPhone:    s.contactPhone    ?? '',
          contactAddress:  s.contactAddress  ?? '',
        });
      })
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  // Poll for QR code when disconnected; auto-refresh every 2 minutes
  useEffect(() => {
    if (loading) return;
    if (waConnected) { setQrDataUrl(null); return; }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await notificationsApi.getWhatsAppQR();
        if (!cancelled) setQrDataUrl(res.qrDataUrl);
      } catch { /* ignore */ }

      try {
        const wa = await notificationsApi.getWhatsAppStatus();
        if (!cancelled) setWaConnected(wa.connected);
      } catch { /* ignore */ }
    };

    const autoRefresh = async () => {
      if (cancelled) return;
      setQrDataUrl(null);
      try { await notificationsApi.refreshWhatsAppQR(); } catch { /* ignore */ }
    };

    poll();
    const pollInterval    = setInterval(poll, 3_000);
    const refreshInterval = setInterval(autoRefresh, 2 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      clearInterval(refreshInterval);
    };
  }, [waConnected, loading]);

  const handleRefreshQR = async () => {
    setQrRefreshing(true);
    setQrDataUrl(null);
    try {
      await notificationsApi.refreshWhatsAppQR();
    } catch { /* ignore */ }
    setQrRefreshing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationsApi.updateSettings(form);
      showSuccess('Settings saved successfully');
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone.trim()) { showError('Enter a mobile number to test'); return; }
    setTesting(true);
    try {
      const res = await notificationsApi.testConnection(testPhone.trim());
      if (res.success) {
        showSuccess('Test message sent! Check your WhatsApp.');
      } else {
        showError(`Test failed: ${res.message}`);
      }
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setTesting(false);
    }
  };

  const patch = (key: string, val: unknown) =>
    setForm((p) => ({ ...p, [key]: val }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <SettingsIcon color="primary" sx={{ mt: 0.25 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            WhatsApp notifications &amp; alert configuration
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* ── Left column ── */}
        <Grid size={{ xs: 12, lg: 8 }}>

          {/* WhatsApp Connection Status */}
          <Paper sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <WhatsAppIcon sx={{ color: '#25D366' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>WhatsApp Connection</Typography>
              <Chip
                label={waConnected ? 'Connected' : 'Disconnected'}
                size="small"
                color={waConnected ? 'success' : 'error'}
                sx={{ ml: 'auto' }}
              />
            </Box>
            <Box sx={{ p: 3 }}>
              {/* Status row */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2, p: 2,
                borderRadius: 2, border: '1px solid',
                borderColor: waConnected ? 'success.light' : 'error.light',
                bgcolor: waConnected ? '#f0fdf4' : '#fff5f5',
                mb: 2,
              }}>
                <PhoneAndroidIcon sx={{ color: waConnected ? 'success.main' : 'error.main', fontSize: 36 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: waConnected ? 'success.main' : 'error.main' }}>
                    {waConnected ? 'WhatsApp is connected and ready to send messages' : 'WhatsApp is not connected'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {waConnected
                      ? 'Messages will be sent from the phone number you scanned with.'
                      : 'Scan the QR code below with WhatsApp on your phone.'}
                  </Typography>
                </Box>
              </Box>

              {/* QR code panel when disconnected */}
              {!waConnected && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {qrDataUrl ? (
                    <>
                      <Box sx={{
                        p: 2, bgcolor: '#fff', borderRadius: 2,
                        border: '2px solid', borderColor: '#25D366',
                        display: 'inline-block',
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrDataUrl} alt="WhatsApp QR Code" width={240} height={240} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                        Open WhatsApp → tap <strong>⋮ Menu</strong> → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → scan this QR
                      </Typography>
                      <Button
                        size="small" variant="outlined" color="inherit"
                        onClick={handleRefreshQR}
                        disabled={qrRefreshing}
                        startIcon={qrRefreshing ? <CircularProgress size={14} /> : undefined}
                      >
                        {qrRefreshing ? 'Refreshing…' : 'Refresh QR Code'}
                      </Button>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 2 }}>
                      <CircularProgress size={32} sx={{ color: '#25D366' }} />
                      <Typography variant="caption" color="text.secondary">
                        Waiting for QR code from server…
                      </Typography>
                      <Button
                        size="small" variant="outlined" color="inherit"
                        onClick={handleRefreshQR}
                        disabled={qrRefreshing}
                      >
                        Force Reconnect
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>

          {/* Alert Thresholds */}
          <Paper sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <NotificationsIcon color="warning" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Alert Thresholds</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {([
                  { label: 'First Alert',  key: 'firstAlertDays',  desc: 'Days before expiry', accent: '#2196f3' },
                  { label: 'Second Alert', key: 'secondAlertDays', desc: 'Days before expiry', accent: '#ff9800' },
                  { label: 'Final Alert',  key: 'finalAlertDays',  desc: 'Days before expiry', accent: '#f44336' },
                ] as const).map(({ label, key, desc, accent }) => (
                  <Grid key={key} size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ borderTop: `3px solid ${accent}`, borderRadius: '4px 4px 0 0', pt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        {label}
                      </Typography>
                      <TextField
                        fullWidth size="small" type="number"
                        slotProps={{
                          htmlInput: { min: 1, max: 365 },
                          input: { endAdornment: <InputAdornment position="end">days</InputAdornment> },
                        }}
                        value={form[key]}
                        onChange={(e) => patch(key, parseInt(e.target.value) || 1)}
                      />
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                        {desc}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  Daily Alert Time
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Select
                    size="small"
                    value={form.schedulerHour}
                    onChange={(e) => patch('schedulerHour', Number(e.target.value))}
                    sx={{ minWidth: 140 }}
                  >
                    {Array.from({ length: 24 }, (_, h) => {
                      const label = h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
                      return <MenuItem key={h} value={h}>{label}</MenuItem>;
                    })}
                  </Select>
                  <Typography variant="caption" color="text.secondary">
                    Main alerts (30/15/7-day &amp; expired) run once at this time.
                    "Expires today" alerts run every 3 hours automatically.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Contact Info */}
          <Paper sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Contact Information</Typography>
              <Typography variant="caption" color="text.secondary">
                Appended as footer to every WhatsApp message (both English &amp; Tamil).
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Business Name
                  </Typography>
                  <TextField
                    fullWidth size="small" placeholder="A2 Insurance"
                    value={form.contactName}
                    onChange={(e) => patch('contactName', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Contact Phone
                  </Typography>
                  <TextField
                    fullWidth size="small" placeholder="9842744566"
                    value={form.contactPhone}
                    onChange={(e) => patch('contactPhone', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Address (Optional)
                  </Typography>
                  <TextField
                    fullWidth size="small" placeholder="123 Main Street, Chennai"
                    value={form.contactAddress}
                    onChange={(e) => patch('contactAddress', e.target.value)}
                  />
                </Grid>
              </Grid>

              {/* Preview */}
              {(form.contactPhone || form.contactName || form.contactAddress) && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, borderLeft: '3px solid', borderColor: 'success.main' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Footer Preview
                  </Typography>
                  <Typography variant="caption" sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
                    {[
                      form.contactPhone   ? `📞 ${form.contactPhone}`   : '',
                      form.contactAddress ? `📍 ${form.contactAddress}` : '',
                      form.contactName    || 'A2 Insurance',
                    ].filter(Boolean).join('\n')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Message Language */}
          <Paper sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Message Language</Typography>
              <Typography variant="caption" color="text.secondary">
                All automatic WhatsApp alerts will be sent in this language.
              </Typography>
            </Box>
            <Box sx={{ p: 3, display: 'flex', gap: 3 }}>
              {[
                { value: 'english', label: 'English' },
                { value: 'tamil',   label: 'தமிழ் (Tamil)' },
              ].map(({ value, label }) => (
                <FormControlLabel
                  key={value}
                  control={
                    <Radio
                      checked={form.language === value}
                      onChange={() => patch('language', value)}
                      size="small"
                    />
                  }
                  label={label}
                />
              ))}
            </Box>
          </Paper>

          {/* Channels */}
          <Paper sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notification Channels</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {([
                  { key: 'enableWhatsApp', label: 'WhatsApp', desc: 'WhatsApp Web', active: true, icon: '💬' },
                  { key: 'enableEmail',    label: 'Email',    desc: 'Coming soon',           active: false, icon: '📧' },
                  { key: 'enableSms',      label: 'SMS',      desc: 'Coming soon',           active: false, icon: '📱' },
                ] as const).map(({ key, label, desc, active, icon }) => (
                  <Grid key={key} size={{ xs: 12, sm: 4 }}>
                    <Box sx={{
                      border: '1px solid',
                      borderColor: (form[key] as boolean) ? 'success.main' : 'divider',
                      borderRadius: 2, p: 2,
                      bgcolor: (form[key] as boolean) ? '#f0fdf4' : 'grey.50',
                      opacity: active ? 1 : 0.55,
                      transition: 'all 0.2s',
                    }}>
                      <FormControlLabel
                        disabled={!active}
                        control={
                          <Switch
                            checked={form[key] as boolean}
                            onChange={(e) => patch(key, e.target.checked)}
                            size="small" color="success"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{icon} {label}</Typography>
                            <Typography variant="caption" color="text.secondary">{desc}</Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>

          <Button
            variant="contained" size="large" disableElevation
            onClick={handleSave}
            disabled={saving}
            fullWidth
            sx={{ maxWidth: { sm: 240 } }}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? 'Saving…' : 'Save All Settings'}
          </Button>
        </Grid>

        {/* ── Right column ── */}
        <Grid size={{ xs: 12, lg: 4 }}>

          {/* Test Connection */}
          <Paper sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <SendIcon sx={{ color: '#25D366' }} fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Test WhatsApp</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Send a test message to verify WhatsApp is working correctly.
              </Typography>
              <TextField
                fullWidth size="small"
                placeholder="10-digit mobile number"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              <Button
                fullWidth variant="contained" disableElevation
                sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' } }}
                onClick={handleTest}
                disabled={testing || !waConnected}
                startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
              >
                {testing ? 'Sending…' : 'Send Test Message'}
              </Button>
              {!waConnected && (
                <Alert severity="warning" sx={{ mt: 1.5, fontSize: '0.75rem' }}>
                  WhatsApp not connected — scan QR in server terminal first
                </Alert>
              )}
            </Box>
          </Paper>

          {/* Stats */}
          {stats && (
            <Paper sx={{ borderRadius: 2 }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notification Summary</Typography>
              </Box>
              <Box sx={{ p: 2.5 }}>
                {[
                  { label: 'Sent',    value: stats.sent,    color: '#27ae60' },
                  { label: 'Failed',  value: stats.failed,  color: '#e74c3c' },
                  { label: 'Pending', value: stats.pending, color: '#f39c12' },
                ].map(({ label, value, color }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Total All-Time</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>{stats.total}</Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* ── Recent Activity ── */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ borderRadius: 2 }}>
            {/* Header */}
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
              <HistoryIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Notification Activity</Typography>
              <Chip label={`${logs.length} records`} size="small" variant="outlined" sx={{ ml: 'auto' }} />

              {/* Export button */}
              {logs.length > 0 && (
                <>
                  <Button
                    size="small" variant="outlined" startIcon={<FileDownloadIcon />}
                    onClick={(e) => setExportAnchor(e.currentTarget)}
                    sx={{ flexShrink: 0 }}
                  >
                    Export
                  </Button>
                  <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                    <MenuItem onClick={() => { exportLogsToExcel(logs, 'notification-logs'); setExportAnchor(null); }}>
                      Download Excel (.xlsx) — {logs.length} rows
                    </MenuItem>
                    <MenuItem onClick={() => { exportLogsToCSV(logs, 'notification-logs'); setExportAnchor(null); }}>
                      Download CSV — {logs.length} rows
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>

            {!logs.length ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications sent yet. WhatsApp alerts will appear here once the scheduler runs.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 700 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        {['Sent At', 'Vehicle', 'Mobile', 'Type', 'Status', 'Message'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.slice((logPage - 1) * PAGE_SIZE, logPage * PAGE_SIZE).map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.75rem' }}>
                            {new Date(log.sentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </TableCell>
                          <TableCell>
                            {log.vehicleRecord ? (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.vehicleRecord.vehicleNumber}</Typography>
                                <Typography variant="caption" color="text.secondary">{log.vehicleRecord.ownerName}</Typography>
                              </>
                            ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{log.mobileNumber}</TableCell>
                          <TableCell>
                            <Chip
                              label={TYPE_LABEL[log.notificationType] ?? log.notificationType}
                              size="small"
                              color={TYPE_COLOR[log.notificationType] ?? 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.68rem' }}
                            />
                          </TableCell>
                          <TableCell><StatusChip status={log.status} /></TableCell>
                          <TableCell>
                            <Tooltip title={log.message}>
                              <Typography
                                variant="caption" color="text.secondary"
                                sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}
                              >
                                {log.message}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {logs.length > PAGE_SIZE && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      {(logPage - 1) * PAGE_SIZE + 1}–{Math.min(logPage * PAGE_SIZE, logs.length)} of {logs.length}
                    </Typography>
                    <IconButton size="small" disabled={logPage === 1} onClick={() => setLogPage((p) => p - 1)}>
                      <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={logPage * PAGE_SIZE >= logs.length} onClick={() => setLogPage((p) => p + 1)}>
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

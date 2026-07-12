'use client';

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Chip, Typography, Box, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NextLink from 'next/link';
import dayjs from 'dayjs';
import { vehicleRecordsApi } from '../../lib/api/vehicle-records';
import { notificationsApi } from '../../lib/api/notifications';
import { useToast } from '../../providers/ToastProvider';
import { parseApiError } from '../../lib/parse-error';
import { useCan } from '../../hooks/useCan';
import type { VehicleRecord } from '../../types/vehicle-record.types';
import DocumentCell from './DocumentCell';
import EditableRemarksCell from '../ui/EditableRemarksCell';

// ─── Category / expiry chips ──────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, 'default' | 'primary' | 'secondary'> = {
  TW: 'default', CAR: 'primary', COMMERCIAL: 'secondary',
};

function expiryChip(dateStr: string, now: dayjs.Dayjs) {
  const diff = dayjs(dateStr).diff(now, 'day');
  const date = dayjs(dateStr).format('DD MMM YYYY');

  let status: string;
  let color: string;
  let bg: string;

  if (diff < 0) { status = 'Expired'; color = '#c62828'; bg = '#ffebee'; }
  else if (diff === 0) { status = 'Expires Today'; color = '#c62828'; bg = '#ffebee'; }
  else if (diff <= 7) { status = `${diff} day${diff > 1 ? 's' : ''} left`; color = '#e65100'; bg = '#fff3e0'; }
  else if (diff <= 30) { status = `${diff} days left`; color = '#1565c0'; bg = '#e3f2fd'; }
  else { status = 'Active'; color = '#2e7d32'; bg = '#e8f5e9'; }

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.4 }}>
      <Box sx={{
        px: 1, py: 0.2, borderRadius: 1,
        bgcolor: bg, color, fontSize: '0.67rem', fontWeight: 700, lineHeight: 1.4,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap',
      }}>
        {status}
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1 }}>
        {date}
      </Typography>
    </Box>
  );
}


// ─── Main table ───────────────────────────────────────────────────────────────

interface Props {
  records: VehicleRecord[];
  loading?: boolean;
  onDelete: (id: number) => void;
}

export default function VehicleRecordTable({ records, loading, onDelete }: Props) {
  const { showSuccess, showError } = useToast();
  const canUpdate = useCan('vehicle-records', 'update');
  const canDelete = useCan('vehicle-records', 'delete');
  const [now, setNow] = useState<dayjs.Dayjs | null>(null);
  const [waTarget, setWaTarget] = useState<VehicleRecord | null>(null);
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [waStep, setWaStep] = useState<'pick' | 'compose'>('compose');
  const [waLang, setWaLang] = useState<'english' | 'tamil'>('english');
  const [contactSettings, setContactSettings] = useState({ name: '', phone: '', address: '' });

  useEffect(() => { setNow(dayjs()); }, []);

  useEffect(() => {
    notificationsApi.getSettings().then((s) => {
      setContactSettings({
        name: s.contactName ?? '',
        phone: s.contactPhone ?? '',
        address: s.contactAddress ?? '',
      });
    }).catch(() => { });
  }, []);

  const buildFooter = (settings: typeof contactSettings): string => {
    const lines = [
      settings.phone ? `📞 ${settings.phone}` : '',
      settings.address ? `📍 ${settings.address}` : '',
      settings.name || 'A2 Insurance Care',
    ].filter(Boolean);
    return `\n\n${lines.join('\n')}`;
  };

  const buildMessage = (r: VehicleRecord, lang: 'english' | 'tamil', settings: typeof contactSettings) => {
    const exp = dayjs(r.policyExpiryDate).format('DD MMM YYYY');
    const diff = dayjs(r.policyExpiryDate).diff(dayjs(), 'day');
    const isTamil = lang === 'tamil';
    const footer = buildFooter(settings);

    if (diff < 0) {
      return isTamil
        ? `அன்புள்ள ${r.ownerName},\n\n⚠️ உங்கள் வாகனம் *${r.vehicleNumber}* க்கான காப்பீடு ${exp} அன்று *காலாவதியாகிவிட்டது*.\n\nசட்ட சிக்கல்களை தவிர்க்க உடனடியாக புதுப்பிக்கவும்.${footer}`
        : `Dear ${r.ownerName},\n\n⚠️ Your vehicle insurance for *${r.vehicleNumber}* has *EXPIRED* on ${exp}.\n\nPlease renew immediately to avoid legal issues.${footer}`;
    }
    if (diff <= 7) {
      return isTamil
        ? `அன்புள்ள ${r.ownerName},\n\n🚨 *அவசரம்!* உங்கள் வாகனம் *${r.vehicleNumber}* க்கான காப்பீடு வெறும் *${diff} நாட்களில்* (${exp}) காலாவதியாகும்.\n\nதாமதிக்காமல் இப்போதே புதுப்பிக்கவும்.${footer}`
        : `Dear ${r.ownerName},\n\n🚨 *URGENT!* Your vehicle insurance for *${r.vehicleNumber}* expires in just *${diff} days* (${exp}).\n\nPlease renew immediately.${footer}`;
    }
    if (diff <= 15) {
      return isTamil
        ? `அன்புள்ள ${r.ownerName},\n\n🔔 நினைவூட்டல்: உங்கள் வாகனம் *${r.vehicleNumber}* க்கான காப்பீடு *${diff} நாட்களில்* (${exp}) காலாவதியாகும்.\n\nசீக்கிரமே புதுப்பிக்கவும்.${footer}`
        : `Dear ${r.ownerName},\n\n🔔 Reminder: Your vehicle insurance for *${r.vehicleNumber}* expires in *${diff} days* (${exp}).\n\nPlease renew soon.${footer}`;
    }
    return isTamil
      ? `அன்புள்ள ${r.ownerName},\n\n📋 முன்னறிவிப்பு: உங்கள் வாகனம் *${r.vehicleNumber}* க்கான காப்பீடு *${diff} நாட்களில்* (${exp}) காலாவதியாகும்.\n\nசமயத்தில் புதுப்பிக்க திட்டமிடவும்.${footer}`
      : `Dear ${r.ownerName},\n\n📋 Advance Notice: Your vehicle insurance for *${r.vehicleNumber}* will expire in *${diff} days* (${exp}).\n\nPlease plan for renewal in advance.${footer}`;
  };

  const openWhatsApp = (r: VehicleRecord) => {
    setWaTarget(r);
    setWaLang('english');
    setWaMessage(buildMessage(r, 'english', contactSettings));
    if (r.cellNumberAlt) {
      setWaStep('pick');
      setWaPhone('');
    } else {
      setWaStep('compose');
      setWaPhone(r.cellNumber);
    }
  };

  const pickNumber = (phone: string) => {
    setWaPhone(phone);
    setWaStep('compose');
  };

  const switchLang = (lang: 'english' | 'tamil') => {
    setWaLang(lang);
    if (waTarget) setWaMessage(buildMessage(waTarget, lang, contactSettings));
  };

  const handleWaSend = async () => {
    if (!waTarget) return;
    setSending(true);
    try {
      const res = await notificationsApi.sendManual({
        mobileNumber: waPhone, message: waMessage, vehicleRecordId: waTarget.id,
      });
      if (res.success) {
        showSuccess(`WhatsApp sent to ${waPhone}`);
        setWaTarget(null);
      } else {
        const isNotConnected = res.message?.toLowerCase().includes('not connected');
        showError(isNotConnected
          ? 'WhatsApp is not connected. Go to Settings → WhatsApp Connection to scan the QR code.'
          : `Send failed: ${res.message}`);
      }
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!records.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">No vehicle records found.</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['S.No', 'Vehicle No.', 'Owner Details', 'Category', 'Policy Expiry', 'Insurance Co.', 'Documents', 'Remarks', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {records.map((r, idx) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>

                <TableCell sx={{ fontWeight: 600 }}>{r.vehicleNumber}</TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.ownerName}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.cellNumber}</Typography>
                  {r.cellNumberAlt && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {r.cellNumberAlt}
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Chip label={r.category} size="small" color={CATEGORY_COLOR[r.category]} />
                </TableCell>

                <TableCell>{now ? expiryChip(r.policyExpiryDate, now) : dayjs(r.policyExpiryDate).format('DD MMM YYYY')}</TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 130, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.insuranceCompany}
                  </Typography>
                </TableCell>

                <TableCell><DocumentCell record={r} /></TableCell>

                <TableCell>
                  <EditableRemarksCell
                    value={r.remarks}
                    canEdit={canUpdate}
                    onSave={(value) => vehicleRecordsApi.update(r.id, { remarks: value })}
                  />
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                    <Tooltip title="View">
                      <IconButton size="small" component={NextLink} href={`/vehicle-records/${r.id}`} color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canUpdate && (
                      <Tooltip title="Edit">
                        <IconButton size="small" component={NextLink} href={`/vehicle-records/${r.id}/edit`} color="info">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Send WhatsApp">
                      <IconButton size="small" color="success" onClick={() => openWhatsApp(r)}>
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete(r.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* WhatsApp dialog */}
      <Dialog open={Boolean(waTarget)} onClose={() => !sending && setWaTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon sx={{ color: '#25D366' }} />
          {waStep === 'pick' ? 'Choose Number to Send' : 'Send WhatsApp Message'}
        </DialogTitle>

        <DialogContent sx={{ pt: '12px !important' }}>
          {/* Vehicle info row */}
          {waTarget && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">To</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {waTarget.ownerName} — {waTarget.vehicleNumber}
              </Typography>
            </Box>
          )}

          {/* ── Step 1: Number picker ── */}
          {waStep === 'pick' && waTarget && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600 }}>
                This owner has two numbers. Select which to send to:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {[
                  { phone: waTarget.cellNumber, label: 'Primary Number' },
                  { phone: waTarget.cellNumberAlt!, label: 'Alternate Number' },
                ].map(({ phone, label }) => (
                  <Box
                    key={phone}
                    onClick={() => pickNumber(phone)}
                    sx={{
                      flex: '1 1 180px',
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: '#25D366', bgcolor: '#f0fdf4' },
                    }}
                  >
                    <WhatsAppIcon sx={{ color: '#25D366', mb: 0.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{phone}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* ── Step 2: Compose ── */}
          {waStep === 'compose' && (
            <>
              {/* Language toggle */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {(['english', 'tamil'] as const).map((lang) => (
                  <Box
                    key={lang}
                    onClick={() => switchLang(lang)}
                    sx={{
                      px: 1.5, py: 0.5, borderRadius: 5, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: waLang === lang ? 'primary.main' : 'divider',
                      bgcolor: waLang === lang ? 'primary.50' : 'transparent',
                      color: waLang === lang ? 'primary.main' : 'text.secondary',
                      fontSize: '0.75rem', fontWeight: waLang === lang ? 700 : 400,
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    {lang === 'english' ? '🇬🇧 English' : '🇮🇳 தமிழ்'}
                  </Box>
                ))}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Mobile Number
              </Typography>
              <TextField
                fullWidth size="small" sx={{ mb: 2 }}
                value={waPhone} onChange={(e) => setWaPhone(e.target.value)}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Message
              </Typography>
              <TextField
                fullWidth multiline rows={4} size="small"
                value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWaTarget(null)} disabled={sending}>Cancel</Button>
          {waStep === 'compose' && (
            <Button
              variant="contained" disableElevation onClick={handleWaSend}
              disabled={sending || !waPhone.trim() || !waMessage.trim()}
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
              sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' } }}
            >
              {sending ? 'Sending…' : 'Send'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

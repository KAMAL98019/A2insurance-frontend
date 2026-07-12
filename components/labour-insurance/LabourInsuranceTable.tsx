'use client';

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Skeleton, Chip, Typography, Box,
  Popover, Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import ArticleIcon from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleIcon from '@mui/icons-material/People';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NextLink from 'next/link';
import dayjs from 'dayjs';
import { labourInsuranceApi } from '../../lib/api/labour-insurance';
import { notificationsApi } from '../../lib/api/notifications';
import { MSG_PREFIX } from '../../lib/whatsapp';
import { useCan } from '../../hooks/useCan';
import WhatsAppSendDialog, { WaLang } from '../notifications/WhatsAppSendDialog';
import type { LabourInsuranceRecord } from '../../types/labour-insurance.types';
import { LABOUR_POLICY_TYPE_LABELS } from '../../types/labour-insurance.types';
import EditableRemarksCell from '../ui/EditableRemarksCell';

// ─── Document cell ────────────────────────────────────────────────────────────

function LabourDocCell({ record }: { record: LabourInsuranceRecord }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [thumbErr, setThumbErr] = useState(false);
  const url = record.policyDocument;
  const isPdf = !!url && (url.endsWith('.pdf') || url.includes('/raw/upload/'));
  const thumbUrl = isPdf && url ? url.replace('/raw/upload/', '/image/upload/pg_1,w_300,q_auto,f_jpg/') : null;
  const uploaded = url ? 1 : 0;

  return (
    <>
      <Chip
        icon={<FolderOpenIcon sx={{ fontSize: '14px !important' }} />}
        label={`${uploaded} / 1`} size="small" variant="outlined"
        color={uploaded === 1 ? 'success' : 'default'}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ cursor: 'pointer', fontWeight: 600 }}
      />
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2.5, boxShadow: 8, mt: 0.5 } } }}>
        <Box sx={{ p: 2, width: 220 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Documents</Typography>
            <Chip label={`${uploaded} of 1`} size="small" color={uploaded === 1 ? 'success' : 'default'} />
          </Box>
          <Divider sx={{ mb: 1.5 }} />
          <Box
            onClick={() => {
              if (!url) return;
              const open = isPdf ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/pdf?url=${encodeURIComponent(url)}` : url;
              window.open(open, '_blank', 'noopener,noreferrer');
            }}
            sx={{
              width: 88, border: '1px solid', borderColor: !url ? 'grey.200' : 'primary.200', borderRadius: 2,
              overflow: 'hidden', opacity: url ? 1 : 0.45, cursor: url ? 'pointer' : 'default',
              '&:hover': url ? { boxShadow: 4, transform: 'translateY(-2px)' } : {}
            }}>
            <Box sx={{
              height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: !url ? 'grey.100' : isPdf && (thumbErr || !thumbUrl) ? 'error.50' : 'primary.50', overflow: 'hidden'
            }}>
              {!url ? <FolderOffIcon sx={{ fontSize: 28, color: 'grey.400' }} />
                : isPdf && thumbUrl && !thumbErr ? (
                  <Box component="img" src={thumbUrl} alt="Policy" loading="lazy" onError={() => setThumbErr(true)}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : isPdf ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                    <ArticleIcon sx={{ fontSize: 30, color: 'error.main' }} />
                    <Typography sx={{ fontSize: '0.55rem', color: 'error.dark', fontWeight: 700 }}>PDF</Typography>
                  </Box>
                ) : (
                  <Box component="img" src={url} alt="Policy" loading="lazy"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
            </Box>
            <Box sx={{ px: 0.75, py: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
              <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: 'text.primary' }}>Policy Doc</Typography>
              {url && <OpenInNewIcon sx={{ fontSize: 10, color: 'text.disabled' }} />}
            </Box>
          </Box>
          {url && <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>Click to open</Typography>}
        </Box>
      </Popover>
    </>
  );
}

function fmtAmount(v: string | number | null) {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? '—' : `₹${n.toLocaleString('en-IN')}`;
}

function expiryChip(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  const date = new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  let status: string; let color: string; let bg: string;
  if (diff < 0) { status = 'Expired'; color = '#c62828'; bg = '#ffebee'; }
  else if (diff === 0) { status = 'Expires Today'; color = '#c62828'; bg = '#ffebee'; }
  else if (diff <= 7) { status = `${diff} day${diff > 1 ? 's' : ''} left`; color = '#e65100'; bg = '#fff3e0'; }
  else if (diff <= 30) { status = `${diff} days left`; color = '#1565c0'; bg = '#e3f2fd'; }
  else { status = 'Active'; color = '#2e7d32'; bg = '#e8f5e9'; }
  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.4 }}>
      <Box sx={{ px: 1, py: 0.2, borderRadius: 1, bgcolor: bg, color, fontSize: '0.67rem', fontWeight: 700, border: `1px solid ${color}30`, whiteSpace: 'nowrap' }}>
        {status}
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1 }}>{date}</Typography>
    </Box>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────

const HEADERS = ['Policy No.', 'Company Name', 'Insurer', 'Mobile', 'Policy Type', 'Employees', 'Total Premium', 'Expiry Date', 'Renewal Date', 'Document', 'Remarks', 'Actions'];

interface Props { records: LabourInsuranceRecord[]; loading: boolean; onDelete: (id: number) => void }

export default function LabourInsuranceTable({ records, loading, onDelete }: Props) {
  const canUpdate = useCan('labour-insurance', 'update');
  const canDelete = useCan('labour-insurance', 'delete');

  const [waTarget, setWaTarget] = useState<LabourInsuranceRecord | null>(null);
  const [contactSettings, setContactSettings] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    notificationsApi.getSettings().then((s) => {
      setContactSettings({ name: s.contactName ?? '', phone: s.contactPhone ?? '', address: s.contactAddress ?? '' });
    }).catch(() => { });
  }, []);

  const buildFooter = () => {
    const lines = [
      contactSettings.phone ? `📞 ${contactSettings.phone}` : '',
      contactSettings.address ? `📍 ${contactSettings.address}` : '',
      contactSettings.name || 'A2 Insurance Care',
    ].filter(Boolean);
    return `\n\n${lines.join('\n')}`;
  };

  const buildWaMessage = (r: LabourInsuranceRecord, lang: WaLang) => {
    const exp = dayjs(r.renewalDate).format('DD MMM YYYY');
    const diff = dayjs(r.renewalDate).diff(dayjs(), 'day');
    const isTamil = lang === 'tamil';
    const footer = buildFooter();

    if (diff < 0) {
      return isTamil
        ? `அன்புள்ள ${r.insuredName},\n\n⚠️ உங்கள் தொழிலாளர் காப்பீடு (*${r.policyNumber}*) ${exp} அன்று *காலாவதியாகிவிட்டது*.\n\nதாமதிக்காமல் புதுப்பிக்கவும்.${footer}`
        : `Dear ${r.insuredName},\n\n⚠️ Your labour insurance policy (*${r.policyNumber}*) has *EXPIRED* on ${exp}.\n\nPlease renew immediately to avoid a coverage gap.${footer}`;
    }
    if (diff <= 7) {
      return isTamil
        ? `அன்புள்ள ${r.insuredName},\n\n🚨 *அவசரம்!* உங்கள் தொழிலாளர் காப்பீடு (*${r.policyNumber}*) வெறும் *${diff} நாட்களில்* (${exp}) புதுப்பிக்க வேண்டும்.\n\nதாமதிக்காமல் இப்போதே தொடர்பு கொள்ளவும்.${footer}`
        : `Dear ${r.insuredName},\n\n🚨 *URGENT!* Your labour insurance policy (*${r.policyNumber}*) renewal is due in just *${diff} days* (${exp}).\n\nPlease contact us immediately.${footer}`;
    }
    if (diff <= 15) {
      return isTamil
        ? `அன்புள்ள ${r.insuredName},\n\n🔔 நினைவூட்டல்: உங்கள் தொழிலாளர் காப்பீடு (*${r.policyNumber}*) *${diff} நாட்களில்* (${exp}) புதுப்பிக்க வேண்டும்.\n\nசீக்கிரமே புதுப்பிக்கவும்.${footer}`
        : `Dear ${r.insuredName},\n\n🔔 Reminder: Your labour insurance policy (*${r.policyNumber}*) renewal is due in *${diff} days* (${exp}).\n\nPlease renew soon.${footer}`;
    }
    return isTamil
      ? `அன்புள்ள ${r.insuredName},\n\n📋 முன்னறிவிப்பு: உங்கள் தொழிலாளர் காப்பீடு (*${r.policyNumber}*) *${diff} நாட்களில்* (${exp}) புதுப்பிக்க வேண்டும்.\n\nசமயத்தில் புதுப்பிக்க திட்டமிடவும்.${footer}`
      : `Dear ${r.insuredName},\n\n📋 Advance Notice: Your labour insurance policy (*${r.policyNumber}*) renewal is due in *${diff} days* (${exp}).\n\nPlease plan for renewal in advance.${footer}`;
  };

  if (loading) return (
    <TableContainer>
      <Table size="small">
        <TableHead><TableRow>{HEADERS.map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>{Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>{Array.from({ length: HEADERS.length }).map((__, j) => <TableCell key={j}><Skeleton variant="text" /></TableCell>)}</TableRow>
        ))}</TableBody>
      </Table>
    </TableContainer>
  );

  if (!records.length) return (
    <Box sx={{ py: 8, textAlign: 'center' }}><Typography color="text.secondary">No labour insurance records found.</Typography></Box>
  );

  return (
    <>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'grey.50' } }}>
              {HEADERS.map((h, i) => (
                <TableCell key={h} align={i === HEADERS.length - 1 ? 'right' : 'left'} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((r) => {
              const renewalDate = r.renewalDate ? new Date(r.renewalDate) : null;
              const today = new Date();
              const daysLeft = renewalDate ? Math.ceil((renewalDate.getTime() - today.getTime()) / 86_400_000) : null;
              const renewalUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
              return (
                <TableRow key={r.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.policyNumber}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{r.insuredName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.insuranceCompanyName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.mobileNumber}</TableCell>
                  <TableCell>
                    {r.labourPolicyType ? (
                      <Chip label={LABOUR_POLICY_TYPE_LABELS[r.labourPolicyType]} size="small"
                        color={r.labourPolicyType === 'NAMED' ? 'info' : 'default'}
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {r.numberOfEmployees != null ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{r.numberOfEmployees}</Typography>
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtAmount(r.totalPremium)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.policyEndDate ? expiryChip(r.policyEndDate) : '—'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Box>
                      <Typography variant="body2">{renewalDate ? renewalDate.toLocaleDateString('en-IN') : '—'}</Typography>
                      {renewalUrgent && daysLeft !== null && (
                        <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                          {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                        </Typography>
                      )}
                      {daysLeft !== null && daysLeft < 0 && (
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>Overdue</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell><LabourDocCell record={r} /></TableCell>
                  <TableCell>
                    <EditableRemarksCell
                      value={r.remarks}
                      canEdit={canUpdate}
                      onSave={(value) => labourInsuranceApi.update(r.id, { remarks: value })}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="View">
                      <IconButton size="small" component={NextLink} href={`/labour-records/${r.id}`}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {canUpdate && (
                      <Tooltip title="Edit">
                        <IconButton size="small" component={NextLink} href={`/labour-records/${r.id}/edit`}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Send WhatsApp">
                      <IconButton size="small" color="success" onClick={() => setWaTarget(r)}><WhatsAppIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete(r.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <WhatsAppSendDialog<LabourInsuranceRecord>
        target={waTarget}
        onClose={() => setWaTarget(null)}
        titleLabel={(t) => `${t.insuredName} — ${t.policyNumber}`}
        getPhone={(t) => t.mobileNumber}
        buildMessage={(t, lang) => MSG_PREFIX + buildWaMessage(t, lang)}
        sendPayloadKey="labourInsuranceId"
      />
    </>
  );
}

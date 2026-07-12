'use client';

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Skeleton, Typography, Box,
} from '@mui/material';
import VisibilityIcon  from '@mui/icons-material/Visibility';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import WhatsAppIcon    from '@mui/icons-material/WhatsApp';
import NextLink        from 'next/link';
import dayjs from 'dayjs';
import { healthInsuranceApi }    from '../../lib/api/health-insurance';
import { notificationsApi }      from '../../lib/api/notifications';
import { MSG_PREFIX }            from '../../lib/whatsapp';
import { useCan }                from '../../hooks/useCan';
import WhatsAppSendDialog, { WaLang } from '../notifications/WhatsAppSendDialog';
import type { HealthInsuranceRecord } from '../../types/health-insurance.types';
import { POLICY_TYPE_LABELS } from '../../types/health-insurance.types';
import HealthDocumentCell from './HealthDocumentCell';
import EditableRemarksCell from '../ui/EditableRemarksCell';

function formatAmount(val: string | number) {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? '—' : `₹${num.toLocaleString('en-IN')}`;
}

function expiryChip(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  const date = new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  let status: string;
  let color: string;
  let bg: string;

  if (diff < 0)        { status = 'Expired';                                        color = '#c62828'; bg = '#ffebee'; }
  else if (diff === 0) { status = 'Expires Today';                                  color = '#c62828'; bg = '#ffebee'; }
  else if (diff <= 7)  { status = `${diff} day${diff > 1 ? 's' : ''} left`;        color = '#e65100'; bg = '#fff3e0'; }
  else if (diff <= 30) { status = `${diff} days left`;                              color = '#1565c0'; bg = '#e3f2fd'; }
  else                 { status = 'Active';                                          color = '#2e7d32'; bg = '#e8f5e9'; }

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
  records: HealthInsuranceRecord[];
  loading: boolean;
  onDelete: (id: number) => void;
}

const HEADERS = ['Policy No.', 'Holder Name', 'Company', 'Mobile', 'Type', 'Sum Insured', 'Premium', 'Expiry Date', 'Renewal Date', 'Documents', 'Remarks', 'Actions'];

export default function HealthInsuranceTable({ records, loading, onDelete }: Props) {
  const canUpdate = useCan('health-insurance', 'update');
  const canDelete = useCan('health-insurance', 'delete');

  const [waTarget, setWaTarget] = useState<HealthInsuranceRecord | null>(null);
  const [contactSettings, setContactSettings] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    notificationsApi.getSettings().then((s) => {
      setContactSettings({ name: s.contactName ?? '', phone: s.contactPhone ?? '', address: s.contactAddress ?? '' });
    }).catch(() => {});
  }, []);

  const buildFooter = () => {
    const lines = [
      contactSettings.phone ? `📞 ${contactSettings.phone}` : '',
      contactSettings.address ? `📍 ${contactSettings.address}` : '',
      contactSettings.name || 'A2 Insurance Care',
    ].filter(Boolean);
    return `\n\n${lines.join('\n')}`;
  };

  const buildWaMessage = (r: HealthInsuranceRecord, lang: WaLang) => {
    const exp = dayjs(r.renewalDate).format('DD MMM YYYY');
    const diff = dayjs(r.renewalDate).diff(dayjs(), 'day');
    const isTamil = lang === 'tamil';
    const footer = buildFooter();

    if (diff < 0) {
      return isTamil
        ? `அன்புள்ள ${r.policyHolderName},\n\n⚠️ உங்கள் ஆரோக்கிய காப்பீடு (*${r.policyNumber}*) ${exp} அன்று *காலாவதியாகிவிட்டது*.\n\nதாமதிக்காமல் புதுப்பிக்கவும்.${footer}`
        : `Dear ${r.policyHolderName},\n\n⚠️ Your health insurance policy (*${r.policyNumber}*) has *EXPIRED* on ${exp}.\n\nPlease renew immediately to avoid a coverage gap.${footer}`;
    }
    if (diff <= 7) {
      return isTamil
        ? `அன்புள்ள ${r.policyHolderName},\n\n🚨 *அவசரம்!* உங்கள் ஆரோக்கிய காப்பீடு (*${r.policyNumber}*) வெறும் *${diff} நாட்களில்* (${exp}) புதுப்பிக்க வேண்டும்.\n\nதாமதிக்காமல் இப்போதே தொடர்பு கொள்ளவும்.${footer}`
        : `Dear ${r.policyHolderName},\n\n🚨 *URGENT!* Your health insurance policy (*${r.policyNumber}*) renewal is due in just *${diff} days* (${exp}).\n\nPlease contact us immediately.${footer}`;
    }
    if (diff <= 15) {
      return isTamil
        ? `அன்புள்ள ${r.policyHolderName},\n\n🔔 நினைவூட்டல்: உங்கள் ஆரோக்கிய காப்பீடு (*${r.policyNumber}*) *${diff} நாட்களில்* (${exp}) புதுப்பிக்க வேண்டும்.\n\nசீக்கிரமே புதுப்பிக்கவும்.${footer}`
        : `Dear ${r.policyHolderName},\n\n🔔 Reminder: Your health insurance policy (*${r.policyNumber}*) renewal is due in *${diff} days* (${exp}).\n\nPlease renew soon.${footer}`;
    }
    return isTamil
      ? `அன்புள்ள ${r.policyHolderName},\n\n📋 முன்னறிவிப்பு: உங்கள் ஆரோக்கிய காப்பீடு (*${r.policyNumber}*) *${diff} நாட்களில்* (${exp}) புதுப்பிக்க வேண்டும்.\n\nசமயத்தில் புதுப்பிக்க திட்டமிடவும்.${footer}`
      : `Dear ${r.policyHolderName},\n\n📋 Advance Notice: Your health insurance policy (*${r.policyNumber}*) renewal is due in *${diff} days* (${exp}).\n\nPlease plan for renewal in advance.${footer}`;
  };

  if (loading) {
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {HEADERS.map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: HEADERS.length }).map((__, j) => (
                  <TableCell key={j}><Skeleton variant="text" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (records.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">No health insurance records found.</Typography>
      </Box>
    );
  }

  return (
    <>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { bgcolor: 'grey.50' } }}>
            {HEADERS.map((h, i) => (
              <TableCell
                key={h}
                align={i === HEADERS.length - 1 ? 'right' : 'left'}
                sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((r) => {
            const renewalDate   = r.renewalDate ? new Date(r.renewalDate) : null;
            const today         = new Date();
            const daysLeft      = renewalDate
              ? Math.ceil((renewalDate.getTime() - today.getTime()) / 86_400_000)
              : null;
            const renewalUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

            return (
              <TableRow key={r.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.policyNumber}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{r.policyHolderName}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.insuranceCompanyName}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.mobileNumber}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="caption">{POLICY_TYPE_LABELS[r.policyType]}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{formatAmount(r.sumInsured)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAmount(r.premiumAmount)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {r.policyEndDate ? expiryChip(r.policyEndDate) : '—'}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Box>
                    <Typography variant="body2">
                      {renewalDate ? renewalDate.toLocaleDateString('en-IN') : '—'}
                    </Typography>
                    {renewalUrgent && daysLeft !== null && (
                      <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                        {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                      </Typography>
                    )}
                    {daysLeft !== null && daysLeft < 0 && (
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                        Overdue
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <HealthDocumentCell record={r} />
                </TableCell>
                <TableCell>
                  <EditableRemarksCell
                    value={r.remarks}
                    canEdit={canUpdate}
                    onSave={(value) => healthInsuranceApi.update(r.id, { remarks: value })}
                  />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="View">
                    <IconButton size="small" component={NextLink} href={`/health-records/${r.id}`}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canUpdate && (
                    <Tooltip title="Edit">
                      <IconButton size="small" component={NextLink} href={`/health-records/${r.id}/edit`}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Send WhatsApp">
                    <IconButton size="small" color="success" onClick={() => setWaTarget(r)}>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

    <WhatsAppSendDialog<HealthInsuranceRecord>
      target={waTarget}
      onClose={() => setWaTarget(null)}
      titleLabel={(t) => `${t.policyHolderName} — ${t.policyNumber}`}
      getPhone={(t) => t.mobileNumber}
      buildMessage={(t, lang) => MSG_PREFIX + buildWaMessage(t, lang)}
      sendPayloadKey="healthInsuranceId"
    />
    </>
  );
}

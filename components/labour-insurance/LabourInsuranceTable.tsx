'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Skeleton, Chip, Typography, Box, CircularProgress,
  Button, Menu, MenuItem, ListItemIcon, Popover, Divider,
} from '@mui/material';
import VisibilityIcon  from '@mui/icons-material/Visibility';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import AddIcon         from '@mui/icons-material/Add';
import ExpandMoreIcon  from '@mui/icons-material/ExpandMore';
import CheckIcon       from '@mui/icons-material/Check';
import FolderOpenIcon  from '@mui/icons-material/FolderOpen';
import FolderOffIcon   from '@mui/icons-material/FolderOff';
import ArticleIcon     from '@mui/icons-material/Article';
import OpenInNewIcon   from '@mui/icons-material/OpenInNew';
import PeopleIcon      from '@mui/icons-material/People';
import NextLink        from 'next/link';
import { labourRenewalsApi }  from '../../lib/api/labour-renewals';
import { useToast }           from '../../providers/ToastProvider';
import { parseApiError }      from '../../lib/parse-error';
import { useCan }             from '../../hooks/useCan';
import type { LabourInsuranceRecord, EmbeddedLabourRenewal, LabourRenewalStatus, LabourPolicyStatus } from '../../types/labour-insurance.types';
import { LABOUR_STATUS_LABELS, LABOUR_STATUS_COLORS, LABOUR_POLICY_TYPE_LABELS } from '../../types/labour-insurance.types';

// ─── Renewal status config ────────────────────────────────────────────────────

interface StatusCfg { label: string; color: string; bg: string }
const RENEWAL_STATUS: Record<LabourRenewalStatus, StatusCfg> = {
  CONTACTED:       { label: 'Contacted',       color: '#1565c0', bg: '#e3f2fd' },
  DOCS_COLLECTED:  { label: 'Docs Collected',  color: '#6a1b9a', bg: '#f3e5f5' },
  PROCESSING:      { label: 'Processing',      color: '#0277bd', bg: '#e1f5fe' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: '#e65100', bg: '#fff3e0' },
  RENEWED:         { label: 'Renewed',         color: '#2e7d32', bg: '#e8f5e9' },
  CANCELLED:       { label: 'Cancelled',       color: '#757575', bg: '#f5f5f5' },
};
const ALL_STATUSES = Object.entries(RENEWAL_STATUS) as [LabourRenewalStatus, StatusCfg][];

// ─── Inline renewal cell ──────────────────────────────────────────────────────

function LabourRenewalCell({ labourId, initial, canCreate, canUpdate }: { labourId: number; initial: EmbeddedLabourRenewal | null; canCreate: boolean; canUpdate: boolean }) {
  const { showError } = useToast();
  const [renewal, setRenewal] = useState<EmbeddedLabourRenewal | null>(initial);
  const [busy,    setBusy]    = useState(false);
  const [anchor,  setAnchor]  = useState<HTMLElement | null>(null);

  const startTracking = async () => {
    setBusy(true);
    try {
      const c = await labourRenewalsApi.create({ labourInsuranceId: labourId, status: 'CONTACTED' });
      setRenewal({ id: c.id, status: c.status, notes: c.notes, renewedDate: c.renewedDate, createdAt: c.createdAt, updatedAt: c.updatedAt });
    } catch (err) { showError(parseApiError(err)); }
    finally { setBusy(false); }
  };

  const changeStatus = async (s: LabourRenewalStatus) => {
    if (!renewal || s === renewal.status) { setAnchor(null); return; }
    const prev = renewal;
    setRenewal((r) => r ? { ...r, status: s } : r);
    setAnchor(null);
    try {
      const u = await labourRenewalsApi.update(renewal.id, { status: s });
      setRenewal({ id: u.id, status: u.status, notes: u.notes, renewedDate: u.renewedDate, createdAt: u.createdAt, updatedAt: u.updatedAt });
    } catch (err) { setRenewal(prev); showError(parseApiError(err)); }
  };

  if (!renewal) {
    if (!canCreate) return <Typography variant="caption" color="text.disabled">—</Typography>;
    return (
      <Button size="small" variant="outlined"
        startIcon={busy ? <CircularProgress size={11} /> : <AddIcon sx={{ fontSize: 14 }} />}
        disabled={busy} onClick={startTracking}
        sx={{ fontSize: '0.7rem', py: 0.35, px: 1, borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }}>
        Start
      </Button>
    );
  }

  const cfg = RENEWAL_STATUS[renewal.status];
  return (
    <>
      <Box onClick={(e) => canUpdate && setAnchor(e.currentTarget)}
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: 5,
          bgcolor: cfg.bg, border: `1px solid ${cfg.color}30`, color: cfg.color,
          fontSize: '0.7rem', fontWeight: 700, cursor: canUpdate ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap',
          transition: 'filter 0.15s', '&:hover': canUpdate ? { filter: 'brightness(0.95)' } : {} }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }} />
        {cfg.label}
        {canUpdate && <ExpandMoreIcon sx={{ fontSize: 13, ml: 0.25, opacity: 0.7 }} />}
      </Box>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: 4, minWidth: 180 } } }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        <Typography variant="caption" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', color: 'text.disabled', fontWeight: 600, letterSpacing: 0.5 }}>
          CHANGE STATUS
        </Typography>
        {ALL_STATUSES.map(([val, c]) => (
          <MenuItem key={val} selected={val === renewal.status} onClick={() => changeStatus(val)} sx={{ py: 0.75 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: val === renewal.status ? 700 : 400 }}>{c.label}</Typography>
            {val === renewal.status && <CheckIcon sx={{ fontSize: 14, ml: 'auto', color: c.color }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// ─── Document cell ────────────────────────────────────────────────────────────

function LabourDocCell({ record }: { record: LabourInsuranceRecord }) {
  const [anchor,   setAnchor]   = useState<HTMLElement | null>(null);
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
            sx={{ width: 88, border: '1px solid', borderColor: !url ? 'grey.200' : 'primary.200', borderRadius: 2,
              overflow: 'hidden', opacity: url ? 1 : 0.45, cursor: url ? 'pointer' : 'default',
              '&:hover': url ? { boxShadow: 4, transform: 'translateY(-2px)' } : {} }}>
            <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: !url ? 'grey.100' : isPdf && (thumbErr || !thumbUrl) ? 'error.50' : 'primary.50', overflow: 'hidden' }}>
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

// ─── Status chip ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: LabourPolicyStatus }) {
  return (
    <Chip label={LABOUR_STATUS_LABELS[status]} size="small" variant="outlined"
      sx={{ borderColor: LABOUR_STATUS_COLORS[status], color: LABOUR_STATUS_COLORS[status], borderWidth: 1.5, fontWeight: 600, fontSize: '0.72rem' }} />
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
  if (diff < 0)        { status = 'Expired';                                 color = '#c62828'; bg = '#ffebee'; }
  else if (diff === 0) { status = 'Expires Today';                           color = '#c62828'; bg = '#ffebee'; }
  else if (diff <= 7)  { status = `${diff} day${diff > 1 ? 's' : ''} left`; color = '#e65100'; bg = '#fff3e0'; }
  else if (diff <= 30) { status = `${diff} days left`;                       color = '#1565c0'; bg = '#e3f2fd'; }
  else                 { status = 'Active';                                   color = '#2e7d32'; bg = '#e8f5e9'; }
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

const HEADERS = ['Policy No.', 'Company Name', 'Insurer', 'Mobile', 'Policy Type', 'Employees', 'Total Premium', 'Expiry Date', 'Renewal Date', 'Status', 'Document', 'Tracking', 'Actions'];

interface Props { records: LabourInsuranceRecord[]; loading: boolean; onDelete: (id: number) => void }

export default function LabourInsuranceTable({ records, loading, onDelete }: Props) {
  const canUpdate = useCan('labour-insurance', 'update');
  const canDelete = useCan('labour-insurance', 'delete');
  const canCreate = useCan('labour-insurance', 'create');

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
                <TableCell><StatusChip status={r.policyStatus} /></TableCell>
                <TableCell><LabourDocCell record={r} /></TableCell>
                <TableCell sx={{ py: 1 }}>
                  <LabourRenewalCell labourId={r.id} initial={r.renewals?.[0] ?? null} canCreate={canCreate} canUpdate={canUpdate} />
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
  );
}

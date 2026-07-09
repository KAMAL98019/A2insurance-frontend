'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Skeleton, Chip, Typography, Box, CircularProgress,
  Button, Menu, MenuItem, ListItemIcon,
} from '@mui/material';
import VisibilityIcon  from '@mui/icons-material/Visibility';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import AddIcon         from '@mui/icons-material/Add';
import ExpandMoreIcon  from '@mui/icons-material/ExpandMore';
import CheckIcon       from '@mui/icons-material/Check';
import NextLink        from 'next/link';
import { healthRenewalsApi }     from '../../lib/api/health-renewals';
import { useToast }              from '../../providers/ToastProvider';
import { parseApiError }         from '../../lib/parse-error';
import type {
  HealthInsuranceRecord, HealthPolicyStatus,
  EmbeddedHealthRenewal, HealthRenewalStatus,
} from '../../types/health-insurance.types';
import { POLICY_TYPE_LABELS, POLICY_STATUS_LABELS, POLICY_STATUS_COLORS } from '../../types/health-insurance.types';
import HealthDocumentCell from './HealthDocumentCell';

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusCfg { label: string; color: string; bg: string }

const RENEWAL_STATUS: Record<HealthRenewalStatus, StatusCfg> = {
  CONTACTED:       { label: 'Contacted',       color: '#1565c0', bg: '#e3f2fd' },
  DOCS_COLLECTED:  { label: 'Docs Collected',  color: '#6a1b9a', bg: '#f3e5f5' },
  PROCESSING:      { label: 'Processing',      color: '#0277bd', bg: '#e1f5fe' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: '#e65100', bg: '#fff3e0' },
  RENEWED:         { label: 'Renewed',         color: '#2e7d32', bg: '#e8f5e9' },
  CANCELLED:       { label: 'Cancelled',       color: '#757575', bg: '#f5f5f5' },
};

const ALL_RENEWAL_STATUSES = Object.entries(RENEWAL_STATUS) as [HealthRenewalStatus, StatusCfg][];

// ─── Inline renewal cell ──────────────────────────────────────────────────────

interface HealthRenewalCellProps {
  healthId: number;
  initial: EmbeddedHealthRenewal | null;
}

function HealthRenewalCell({ healthId, initial }: HealthRenewalCellProps) {
  const { showError } = useToast();
  const [renewal, setRenewal] = useState<EmbeddedHealthRenewal | null>(initial);
  const [busy,    setBusy]    = useState(false);
  const [anchor,  setAnchor]  = useState<HTMLElement | null>(null);

  const startTracking = async () => {
    setBusy(true);
    try {
      const created = await healthRenewalsApi.create({ healthInsuranceId: healthId, status: 'CONTACTED' });
      setRenewal({
        id: created.id, status: created.status, notes: created.notes,
        renewedDate: created.renewedDate, createdAt: created.createdAt, updatedAt: created.updatedAt,
      });
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (newStatus: HealthRenewalStatus) => {
    if (!renewal || newStatus === renewal.status) { setAnchor(null); return; }
    const prev = renewal;
    setRenewal((r) => r ? { ...r, status: newStatus } : r);
    setAnchor(null);
    try {
      const updated = await healthRenewalsApi.update(renewal.id, { status: newStatus });
      setRenewal({
        id: updated.id, status: updated.status, notes: updated.notes,
        renewedDate: updated.renewedDate, createdAt: updated.createdAt, updatedAt: updated.updatedAt,
      });
    } catch (err) {
      setRenewal(prev);
      showError(parseApiError(err));
    }
  };

  if (!renewal) {
    return (
      <Button
        size="small" variant="outlined"
        startIcon={busy ? <CircularProgress size={11} /> : <AddIcon sx={{ fontSize: 14 }} />}
        disabled={busy}
        onClick={startTracking}
        sx={{ fontSize: '0.7rem', py: 0.35, px: 1, borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }}
      >
        Start
      </Button>
    );
  }

  const cfg = RENEWAL_STATUS[renewal.status];

  return (
    <>
      <Box
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: 1.25, py: 0.4,
          borderRadius: 5,
          bgcolor: cfg.bg,
          border: `1px solid ${cfg.color}30`,
          color: cfg.color,
          fontSize: '0.7rem', fontWeight: 700,
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          transition: 'filter 0.15s',
          '&:hover': { filter: 'brightness(0.95)' },
        }}
      >
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }} />
        {cfg.label}
        <ExpandMoreIcon sx={{ fontSize: 13, ml: 0.25, opacity: 0.7 }} />
      </Box>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: 4, minWidth: 180 } } }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Typography variant="caption" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', color: 'text.disabled', fontWeight: 600, letterSpacing: 0.5 }}>
          CHANGE STATUS
        </Typography>
        {ALL_RENEWAL_STATUSES.map(([val, c]) => (
          <MenuItem
            key={val}
            selected={val === renewal.status}
            onClick={() => changeStatus(val)}
            sx={{ py: 0.75, fontSize: '0.8rem' }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: val === renewal.status ? 700 : 400 }}>
              {c.label}
            </Typography>
            {val === renewal.status && <CheckIcon sx={{ fontSize: 14, ml: 'auto', color: c.color }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// ─── Policy status chip ───────────────────────────────────────────────────────

function StatusChip({ status }: { status: HealthPolicyStatus }) {
  const color = POLICY_STATUS_COLORS[status];
  return (
    <Chip
      label={POLICY_STATUS_LABELS[status]}
      size="small"
      sx={{ borderColor: color, color, borderWidth: 1.5, fontWeight: 600, fontSize: '0.72rem' }}
      variant="outlined"
    />
  );
}

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

const HEADERS = ['Policy No.', 'Holder Name', 'Company', 'Mobile', 'Type', 'Sum Insured', 'Premium', 'Expiry Date', 'Renewal Date', 'Status', 'Documents', 'Tracking', 'Actions'];

export default function HealthInsuranceTable({ records, loading, onDelete }: Props) {
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
                  <StatusChip status={r.policyStatus} />
                </TableCell>
                <TableCell>
                  <HealthDocumentCell record={r} />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <HealthRenewalCell
                    healthId={r.id}
                    initial={r.renewals?.[0] ?? null}
                  />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="View">
                    <IconButton size="small" component={NextLink} href={`/health-records/${r.id}`}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" component={NextLink} href={`/health-records/${r.id}/edit`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(r.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

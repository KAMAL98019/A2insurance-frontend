'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, TextField, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  CircularProgress, Button,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import NextLink    from 'next/link';
import type { ChipProps } from '@mui/material/Chip';

import { healthRenewalsApi } from '../../../../lib/api/health-renewals';
import { parseApiError }     from '../../../../lib/parse-error';
import { useToast }          from '../../../../providers/ToastProvider';
import type { HealthInsuranceRenewal, RenewalStatus } from '../../../../types/health-renewal.types';
import { POLICY_TYPE_LABELS } from '../../../../types/health-insurance.types';

const STATUS_META: Record<RenewalStatus, { label: string; color: ChipProps['color'] }> = {
  CONTACTED:       { label: 'Contacted',       color: 'info'    },
  DOCS_COLLECTED:  { label: 'Docs Collected',  color: 'default' },
  PROCESSING:      { label: 'Processing',      color: 'warning' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'warning' },
  RENEWED:         { label: 'Renewed',         color: 'success' },
  CANCELLED:       { label: 'Cancelled',       color: 'error'   },
};

const ALL_STATUSES = Object.keys(STATUS_META) as RenewalStatus[];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HealthRenewalHistoryPage() {
  const { showError }  = useToast();
  const [renewals,  setRenewals]  = useState<HealthInsuranceRenewal[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState<RenewalStatus | 'ALL'>('ALL');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    healthRenewalsApi.getAll()
      .then(setRenewals)
      .catch((err) => showError(parseApiError(err)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = renewals;
    if (statusFilter !== 'ALL') list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.healthInsurance.policyHolderName.toLowerCase().includes(q) ||
        r.healthInsurance.policyNumber.toLowerCase().includes(q) ||
        r.healthInsurance.mobileNumber.includes(q) ||
        r.healthInsurance.insuranceCompanyName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [renewals, statusFilter, search]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Health Renewal History</Typography>
            <Typography variant="body2" color="text.secondary">
              All health renewal records — {renewals.length} total
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small" component={NextLink} href="/health-records">
          Health Records
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField size="small" placeholder="Search holder, policy no., company…"
            sx={{ flex: '1 1 180px', minWidth: 140 }}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
            <TextField select size="small" label="Status" sx={{ width: 180 }}
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RenewalStatus | 'ALL')}>
              <MenuItem value="ALL">All Statuses</MenuItem>
              {ALL_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  <Chip label={STATUS_META[s].label} size="small" color={STATUS_META[s].color} sx={{ cursor: 'pointer' }} />
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {filtered.length} of {renewals.length} records
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              {renewals.length === 0 ? 'No renewal records yet.' : 'No records match the filters.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['S.No', 'Policy Holder', 'Policy No.', 'Company', 'Type', 'Renewal Date', 'Status', 'Notes', 'Started', 'Renewed On'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r, idx) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.healthInsurance.policyHolderName}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.healthInsurance.mobileNumber}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.healthInsurance.policyNumber}</TableCell>
                      <TableCell sx={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.healthInsurance.insuranceCompanyName}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {POLICY_TYPE_LABELS[r.healthInsurance.policyType as keyof typeof POLICY_TYPE_LABELS] ?? r.healthInsurance.policyType}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.healthInsurance.renewalDate)}</TableCell>
                      <TableCell>
                        <Chip label={meta.label} size="small" color={meta.color}
                          variant={r.status === 'RENEWED' ? 'filled' : 'outlined'} />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Typography variant="caption" color="text.secondary"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {r.notes ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {r.renewedDate ? (
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                            {formatDate(r.renewedDate)}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

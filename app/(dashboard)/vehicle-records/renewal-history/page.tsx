'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, TextField, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  CircularProgress, Button,
} from '@mui/material';
import HistoryIcon       from '@mui/icons-material/History';
import NextLink          from 'next/link';
import type { ChipProps } from '@mui/material/Chip';
import { renewalsApi }   from '../../../../lib/api/renewals';
import { parseApiError } from '../../../../lib/parse-error';
import { useToast }      from '../../../../providers/ToastProvider';
import type { VehicleRenewal, RenewalStatus } from '../../../../types/renewal.types';

const STATUS_META: Record<RenewalStatus, { label: string; color: ChipProps['color'] }> = {
  CONTACTED:       { label: 'Contacted',       color: 'info'    },
  DOCS_COLLECTED:  { label: 'Docs Collected',  color: 'default' },
  PROCESSING:      { label: 'Processing',      color: 'warning' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'warning' },
  RENEWED:         { label: 'Renewed',         color: 'success' },
  CANCELLED:       { label: 'Cancelled',       color: 'error'   },
};

const ALL_STATUSES = Object.keys(STATUS_META) as RenewalStatus[];

export default function RenewalHistoryPage() {
  const { showError }  = useToast();
  const [renewals,  setRenewals]  = useState<VehicleRenewal[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState<RenewalStatus | 'ALL'>('ALL');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    renewalsApi.getAll()
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
      list = list.filter(
        (r) =>
          r.vehicleRecord.vehicleNumber.toLowerCase().includes(q) ||
          r.vehicleRecord.ownerName.toLowerCase().includes(q) ||
          r.vehicleRecord.cellNumber.includes(q) ||
          (r.vehicleRecord.cellNumberAlt ?? '').includes(q),
      );
    }
    return list;
  }, [renewals, statusFilter, search]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Renewal History</Typography>
            <Typography variant="body2" color="text.secondary">
              All renewal records — {renewals.length} total
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined" size="small"
          component={NextLink}
          href="/vehicle-records"
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Vehicle List
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search vehicle, owner…"
            sx={{ flex: '1 1 180px', minWidth: 140 }}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
            <TextField
              select size="small" label="Status" sx={{ width: 180 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RenewalStatus | 'ALL')}
            >
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

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              {renewals.length === 0
                ? 'No renewal records yet.'
                : 'No records match the filters.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['S.No','Vehicle No.','Owner','Category','Policy Expiry','Insurance Co.','Status','Notes','Started','Renewed On'].map((h) => (
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

                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {r.vehicleRecord.vehicleNumber}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.vehicleRecord.ownerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.vehicleRecord.cellNumber}</Typography>
                      </TableCell>

                      <TableCell>
                        <Chip label={r.vehicleRecord.category} size="small" />
                      </TableCell>

                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(r.vehicleRecord.policyExpiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.vehicleRecord.insuranceCompany}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={meta.label}
                          size="small"
                          color={meta.color}
                          variant={r.status === 'RENEWED' ? 'filled' : 'outlined'}
                        />
                      </TableCell>

                      <TableCell sx={{ maxWidth: 160 }}>
                        <Typography
                          variant="caption" color="text.secondary"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                        >
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
                            {new Date(r.renewedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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

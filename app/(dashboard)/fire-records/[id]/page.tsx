'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import {
  Box, Typography, Breadcrumbs, Link as MuiLink, Paper, Grid,
  Chip, Divider, Button, Alert, Skeleton,
} from '@mui/material';
import EditIcon      from '@mui/icons-material/Edit';
import ArticleIcon   from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NextLink      from 'next/link';

import { fireInsuranceApi }   from '../../../../lib/api/fire-insurance';
import { parseApiError }      from '../../../../lib/parse-error';
import type { FireInsuranceRecord } from '../../../../types/fire-insurance.types';
import { FIRE_STATUS_LABELS, FIRE_STATUS_COLORS } from '../../../../types/fire-insurance.types';

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, letterSpacing: 0.4, mb: 0.25 }}>
        {label.toUpperCase()}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || <Typography component="span" variant="body2" color="text.disabled">—</Typography>}
      </Typography>
    </Box>
  );
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, opacity: 0.5 }}>
      <ArticleIcon fontSize="small" color="disabled" />
      <Typography variant="body2" color="text.disabled">{label} — Not uploaded</Typography>
    </Box>
  );
  return (
    <Box component="a" href={url} target="_blank" rel="noopener noreferrer"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5, textDecoration: 'none', color: 'primary.main', '&:hover': { bgcolor: 'primary.50' } }}>
      <ArticleIcon fontSize="small" />
      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{label}</Typography>
      <OpenInNewIcon fontSize="small" />
    </Box>
  );
}

function fmtAmount(v: string | number | null | undefined) {
  if (!v) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? '—' : `₹${n.toLocaleString('en-IN')}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FireRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record,  setRecord]  = useState<FireInsuranceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fireInsuranceApi.getOne(Number(id))
      .then(setRecord)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={300} height={28} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" height={400} />
    </Box>
  );

  if (error || !record) return <Alert severity="error">{error || 'Record not found.'}</Alert>;

  const statusColor = FIRE_STATUS_COLORS[record.policyStatus];

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/fire-records" underline="hover" color="inherit">
          Fire Insurance Records
        </MuiLink>
        <Typography color="text.primary">{record.insuredName}</Typography>
      </Breadcrumbs>

      {/* ── Title Row ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{record.insuredName}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 0.75 }}>
            Policy No: {record.policyNumber}
          </Typography>
          <Chip label={FIRE_STATUS_LABELS[record.policyStatus]} size="small"
            sx={{ borderColor: statusColor, color: statusColor, borderWidth: 1.5, fontWeight: 600 }} variant="outlined" />
        </Box>
        <Button variant="outlined" startIcon={<EditIcon />}
          component={NextLink} href={`/fire-records/${record.id}/edit`}>
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* ── Insured / Business ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Insured / Business Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Insured Name"   value={record.insuredName} />
            <DetailRow label="Mobile"         value={record.mobileNumber} />
            <DetailRow label="Email"          value={record.email} />
            <DetailRow label="GST Number"     value={record.gstNumber} />
            <DetailRow label="Business Type"  value={record.businessType} />
            <DetailRow label="Financier Name" value={record.financierName} />
            <DetailRow label="Address"        value={record.address} />
          </Paper>
        </Grid>

        {/* ── Policy Details ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Policy Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Policy Number"     value={record.policyNumber} />
            <DetailRow label="Insurance Company" value={record.insuranceCompanyName} />
            <DetailRow label="Policy Status"     value={
              <Chip label={FIRE_STATUS_LABELS[record.policyStatus]} size="small"
                sx={{ borderColor: statusColor, color: statusColor, borderWidth: 1.5, fontWeight: 600 }} variant="outlined" />
            } />
            <DetailRow label="Start Date"   value={fmtDate(record.policyStartDate)} />
            <DetailRow label="End Date"     value={fmtDate(record.policyEndDate)} />
            <DetailRow label="Renewal Date" value={fmtDate(record.renewalDate)} />
          </Paper>
        </Grid>

        {/* ── Premium Breakdown ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Premium Breakdown</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Sum Insured"    value={fmtAmount(record.sumInsured)} />
            <DetailRow label="Net Premium"    value={fmtAmount(record.netPremium)} />
            <DetailRow label="CGST"           value={fmtAmount(record.cgst)} />
            <DetailRow label="SGST"           value={fmtAmount(record.sgst)} />
            <DetailRow label="Stamp Duty"     value={fmtAmount(record.stampDuty)} />
            <DetailRow label="Total Premium"  value={fmtAmount(record.totalPremium)} />
          </Paper>
        </Grid>

        {/* ── Receipt & Agent ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Receipt &amp; Agent Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Receipt Number" value={record.receiptNumber} />
            <DetailRow label="Receipt Date"   value={fmtDate(record.receiptDate)} />
            <DetailRow label="Agent Name"     value={record.agentName} />
            <DetailRow label="Agent Code"     value={record.agentCode} />
            <DetailRow label="Customer Type"  value={record.customerType === 'NEW' ? 'New' : 'Renewal'} />
            <DetailRow label="Lead Source"    value={record.leadSource} />
            {record.remarks && <DetailRow label="Remarks" value={record.remarks} />}
          </Paper>
        </Grid>

        {/* ── Documents ── */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Documents</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DocLink label="Policy Document" url={record.policyDocument} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

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
import PeopleIcon    from '@mui/icons-material/People';
import NextLink      from 'next/link';

import { labourInsuranceApi }     from '../../../../lib/api/labour-insurance';
import { parseApiError }          from '../../../../lib/parse-error';
import type { LabourInsuranceRecord } from '../../../../types/labour-insurance.types';
import { LABOUR_STATUS_LABELS, LABOUR_STATUS_COLORS, LABOUR_POLICY_TYPE_LABELS } from '../../../../types/labour-insurance.types';

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
  if (!v && v !== 0) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? '—' : `₹${n.toLocaleString('en-IN')}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LabourRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record,  setRecord]  = useState<LabourInsuranceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    labourInsuranceApi.getOne(Number(id))
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

  const statusColor = LABOUR_STATUS_COLORS[record.policyStatus];

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/labour-records" underline="hover" color="inherit">
          Labour Insurance Records
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={LABOUR_STATUS_LABELS[record.policyStatus]} size="small"
              sx={{ borderColor: statusColor, color: statusColor, borderWidth: 1.5, fontWeight: 600 }} variant="outlined" />
            {record.labourPolicyType && (
              <Chip label={LABOUR_POLICY_TYPE_LABELS[record.labourPolicyType]} size="small" variant="outlined" color="info" />
            )}
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<EditIcon />}
          component={NextLink} href={`/labour-records/${record.id}/edit`}>
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* ── Company / Insured ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Company / Insured Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Insured Name"         value={record.insuredName} />
            <DetailRow label="Mobile"               value={record.mobileNumber} />
            <DetailRow label="Email"                value={record.email} />
            <DetailRow label="GST Number"           value={record.gstNumber} />
            <DetailRow label="Business Description" value={record.businessDescription} />
            <DetailRow label="Address"              value={record.address} />
          </Paper>
        </Grid>

        {/* ── Policy Details ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Policy Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Policy Number"     value={record.policyNumber} />
            <DetailRow label="Insurance Company" value={record.insuranceCompanyName} />
            <DetailRow label="Policy Type"       value={record.labourPolicyType ? LABOUR_POLICY_TYPE_LABELS[record.labourPolicyType] : undefined} />
            <DetailRow label="Policy Status"     value={
              <Chip label={LABOUR_STATUS_LABELS[record.policyStatus]} size="small"
                sx={{ borderColor: statusColor, color: statusColor, borderWidth: 1.5, fontWeight: 600 }} variant="outlined" />
            } />
            <DetailRow label="Intermediary Code" value={record.intermediaryCode} />
            <DetailRow label="Intermediary Name" value={record.intermediaryName} />
            <DetailRow label="Start Date"        value={fmtDate(record.policyStartDate)} />
            <DetailRow label="End Date"          value={fmtDate(record.policyEndDate)} />
            <DetailRow label="Renewal Date"      value={fmtDate(record.renewalDate)} />
          </Paper>
        </Grid>

        {/* ── Employee & Wages ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PeopleIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Employee &amp; Wages</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Number of Employees"  value={record.numberOfEmployees?.toString()} />
            <DetailRow label="Wages per Employee"   value={fmtAmount(record.wagesPerEmployee)} />
            <DetailRow label="Total Declared Wages" value={fmtAmount(record.totalDeclaredWages)} />
          </Paper>
        </Grid>

        {/* ── Premium ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Premium Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Premium"       value={fmtAmount(record.premium)} />
            <DetailRow label="CGST"          value={fmtAmount(record.cgst)} />
            <DetailRow label="SGST"          value={fmtAmount(record.sgst)} />
            <DetailRow label="Total Premium" value={fmtAmount(record.totalPremium)} />
            <DetailRow label="Receipt Number" value={record.receiptNumber} />
            <DetailRow label="Receipt Date"   value={fmtDate(record.receiptDate)} />
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

'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import {
  Box, Typography, Breadcrumbs, Link as MuiLink, Paper, Grid,
  Chip, Divider, Button, CircularProgress, Alert, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import EditIcon      from '@mui/icons-material/Edit';
import WhatsAppIcon  from '@mui/icons-material/WhatsApp';
import ArticleIcon   from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleIcon    from '@mui/icons-material/People';
import NextLink      from 'next/link';

import { healthInsuranceApi }  from '../../../../lib/api/health-insurance';
import { parseApiError }       from '../../../../lib/parse-error';
import { useToast }            from '../../../../providers/ToastProvider';
import type { HealthInsuranceRecord } from '../../../../types/health-insurance.types';
import {
  POLICY_TYPE_LABELS, POLICY_STATUS_LABELS, POLICY_STATUS_COLORS,
  PAYMENT_MODE_LABELS,
} from '../../../../types/health-insurance.types';

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
  if (!url) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, opacity: 0.5 }}>
        <ArticleIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.disabled">{label} — Not uploaded</Typography>
      </Box>
    );
  }
  return (
    <Box
      component="a" href={url} target="_blank" rel="noopener noreferrer"
      sx={{
        display: 'flex', alignItems: 'center', gap: 1, p: 1.5,
        border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5,
        textDecoration: 'none', color: 'primary.main',
        '&:hover': { bgcolor: 'primary.50' },
      }}
    >
      <ArticleIcon fontSize="small" />
      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{label}</Typography>
      <OpenInNewIcon fontSize="small" />
    </Box>
  );
}

function formatAmount(val: string | number | undefined | null) {
  if (!val) return '—';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? '—' : `₹${num.toLocaleString('en-IN')}`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HealthRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showSuccess, showError } = useToast();
  const [record,  setRecord]  = useState<HealthInsuranceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // WhatsApp dialog state
  const [waOpen,    setWaOpen]    = useState(false);
  const [waMsg,     setWaMsg]     = useState('');
  const [waSending, setWaSending] = useState(false);

  useEffect(() => {
    healthInsuranceApi.getOne(Number(id))
      .then(setRecord)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSendWA = async () => {
    setWaSending(true);
    try {
      const res = await healthInsuranceApi.sendWhatsApp(Number(id), waMsg.trim() || undefined);
      if (res?.success === false) {
        showError(res.message || 'Failed to send WhatsApp message.');
      } else {
        showSuccess('WhatsApp message sent successfully.');
        setWaOpen(false);
        setWaMsg('');
      }
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setWaSending(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={28} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (error || !record) {
    return <Alert severity="error">{error || 'Record not found.'}</Alert>;
  }

  const statusColor = POLICY_STATUS_COLORS[record.policyStatus];

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href="/health-records" underline="hover" color="inherit">
          Health Insurance Records
        </MuiLink>
        <Typography color="text.primary">{record.policyHolderName}</Typography>
      </Breadcrumbs>

      {/* ── Title Row ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{record.policyHolderName}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 0.75 }}>
            Policy No: {record.policyNumber}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={POLICY_STATUS_LABELS[record.policyStatus]}
              size="small"
              sx={{ borderColor: statusColor, color: statusColor, borderWidth: 1.5, fontWeight: 600 }}
              variant="outlined"
            />
            <Chip label={POLICY_TYPE_LABELS[record.policyType]} size="small" variant="outlined" />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            onClick={() => setWaOpen(true)}
            sx={{ borderColor: '#25D366', color: '#25D366', '&:hover': { borderColor: '#128C7E', color: '#128C7E', bgcolor: 'rgba(37,211,102,0.06)' } }}
          >
            Send WhatsApp
          </Button>
          <Button variant="outlined" startIcon={<EditIcon />}
            component={NextLink} href={`/health-records/${record.id}/edit`}>
            Edit
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* ── Policy Holder Info ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Policy Holder Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Full Name"     value={record.policyHolderName} />
            <DetailRow label="Mobile"        value={record.mobileNumber} />
            <DetailRow label="Email"         value={record.email} />
            <DetailRow label="Date of Birth" value={formatDate(record.dateOfBirth)} />
            <DetailRow label="Gender"        value={record.gender} />
            <DetailRow label="Address"       value={record.address} />
          </Paper>
        </Grid>

        {/* ── Policy Details ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Policy Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Policy Number"    value={record.policyNumber} />
            <DetailRow label="Insurance Company" value={record.insuranceCompanyName} />
            <DetailRow label="Policy Type"      value={POLICY_TYPE_LABELS[record.policyType]} />
            <DetailRow label="Policy Status"    value={
              <Chip label={POLICY_STATUS_LABELS[record.policyStatus]} size="small"
                sx={{ borderColor: statusColor, color: statusColor, borderWidth: 1.5, fontWeight: 600 }} variant="outlined" />
            } />
            <DetailRow label="Start Date"       value={formatDate(record.policyStartDate)} />
            <DetailRow label="End Date"         value={formatDate(record.policyEndDate)} />
            <DetailRow label="Renewal Date"     value={formatDate(record.renewalDate)} />
          </Paper>
        </Grid>

        {/* ── Coverage & Payment ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Coverage &amp; Payment</Typography>
            <Divider sx={{ mb: 2 }} />
            <DetailRow label="Sum Insured"    value={formatAmount(record.sumInsured)} />
            <DetailRow label="Premium Amount" value={formatAmount(record.premiumAmount)} />
            <DetailRow label="Payment Mode"   value={record.paymentMode ? PAYMENT_MODE_LABELS[record.paymentMode] : undefined} />
            <DetailRow label="Customer Type"  value={record.customerType === 'NEW' ? 'New' : 'Renewal'} />
            <DetailRow label="Lead Source"    value={record.leadSource} />
            <DetailRow label="Renewal Reminder Status" value={record.renewalReminderStatus} />
            {record.remarks && <DetailRow label="Remarks" value={record.remarks} />}
          </Paper>
        </Grid>

        {/* ── Nominee ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Nominee Details</Typography>
            <Divider sx={{ mb: 2 }} />
            {record.nomineeName ? (
              <>
                <DetailRow label="Nominee Name"   value={record.nomineeName} />
                <DetailRow label="Relationship"   value={record.nomineeRelationship} />
                <DetailRow label="Nominee Mobile" value={record.nomineeMobileNumber} />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">No nominee details added.</Typography>
            )}
          </Paper>
        </Grid>

        {/* ── Family Members ── */}
        {record.policyType === 'FAMILY_FLOATER' && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PeopleIcon color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Family Members ({record.familyMembers.length})
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {record.familyMembers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No family members added.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {record.familyMembers.map((m) => (
                    <Grid key={m.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{m.memberName}</Typography>
                        <DetailRow label="Relationship" value={m.relationship} />
                        {m.dateOfBirth && <DetailRow label="Date of Birth" value={formatDate(m.dateOfBirth)} />}
                        {m.gender && <DetailRow label="Gender" value={m.gender} />}
                        {m.preExistingDisease && <DetailRow label="Pre-existing Disease" value={m.preExistingDisease} />}
                        {m.medicalHistory && <DetailRow label="Medical History" value={m.medicalHistory} />}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        )}

        {/* ── Documents ── */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Documents</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DocLink label="Policy Document"  url={record.policyDocument} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DocLink label="ID Proof"         url={record.idProof} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DocLink label="Medical Document" url={record.medicalDocument} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* ── WhatsApp Send Dialog ── */}
      <Dialog open={waOpen} onClose={() => !waSending && setWaOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send WhatsApp Reminder</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sending to <strong>{record.mobileNumber}</strong> — {record.policyHolderName}
            {' '}(Policy: {record.policyNumber}).
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Leave blank to send the automatic renewal reminder message, or type a custom message below.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Custom Message (optional)"
            placeholder="Leave blank for auto-generated renewal reminder…"
            value={waMsg}
            onChange={(e) => setWaMsg(e.target.value)}
            disabled={waSending}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setWaOpen(false); setWaMsg(''); }} disabled={waSending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={waSending ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
            onClick={handleSendWA}
            disabled={waSending}
            sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
          >
            {waSending ? 'Sending…' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

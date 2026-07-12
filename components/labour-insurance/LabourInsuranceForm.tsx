'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Grid, TextField, Button, Typography,
  Divider, CircularProgress, Paper, LinearProgress,
  Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArticleIcon from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { labourInsuranceSchema, LabourInsuranceFormValues } from '../../lib/validations/labour-insurance.schema';
import { uploadDocument } from '../../lib/api/upload';
import { parseApiError } from '../../lib/parse-error';
import { useToast } from '../../providers/ToastProvider';
import { useLeadSources } from '../../hooks/useLeadSources';
import { useInsuranceCompanies } from '../../hooks/useInsuranceCompanies';
import LoadingButton from '../ui/LoadingButton';
import SearchableSelect from '../ui/SearchableSelect';
import type { LabourInsuranceRecord } from '../../types/labour-insurance.types';

const POLICY_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'PENDING_RENEWAL', label: 'Pending Renewal' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const POLICY_TYPES = [
  { value: 'UNNAMED', label: 'Unnamed (Group)' },
  { value: 'NAMED', label: 'Named' },
] as const;

const CUSTOMER_TYPES = [
  { value: 'NEW', label: 'New' },
  { value: 'RENEWAL', label: 'Renewal' },
] as const;

function isPdfUrl(url: string | null | undefined) {
  if (!url) return false;
  return url.endsWith('.pdf') || url.includes('/raw/upload/');
}

function formatBytes(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const EMPTY: LabourInsuranceFormValues = {
  policyNumber: '', insuranceCompanyName: '', insuredName: '', mobileNumber: '',
  email: '', address: '', businessDescription: '', gstNumber: '',
  intermediaryCode: '', intermediaryName: '',
  policyStartDate: '', policyEndDate: '', renewalDate: '', policyStatus: 'ACTIVE',
  labourPolicyType: 'UNNAMED',
  numberOfEmployees: 0, wagesPerEmployee: 0, totalDeclaredWages: 0,
  premium: 0, cgst: 0, sgst: 0, totalPremium: 0,
  receiptNumber: '', receiptDate: '',
  customerType: 'NEW', leadSource: '', remarks: '', policyDocument: '',
};

interface Props {
  defaultValues?: Partial<LabourInsuranceFormValues>;
  existing?: LabourInsuranceRecord;
  onSubmit: (values: LabourInsuranceFormValues) => Promise<void>;
  submitLabel?: string;
}

export default function LabourInsuranceForm({ defaultValues, existing, onSubmit, submitLabel = 'Save' }: Props) {
  const { showError } = useToast();
  const { sources: leadSources } = useLeadSources();
  const { companies: insuranceCompanies } = useInsuranceCompanies();
  const pendingFileRef = useRef<File | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const isSubmittingRef = useRef(false);

  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingPreview, setPendingPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => { objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)); };
  }, []);

  const getInitialValues = (): LabourInsuranceFormValues => {
    if (existing) {
      return {
        policyNumber: existing.policyNumber,
        insuranceCompanyName: existing.insuranceCompanyName,
        insuredName: existing.insuredName,
        mobileNumber: existing.mobileNumber,
        email: existing.email ?? '',
        address: existing.address ?? '',
        businessDescription: existing.businessDescription ?? '',
        gstNumber: existing.gstNumber ?? '',
        intermediaryCode: existing.intermediaryCode ?? '',
        intermediaryName: existing.intermediaryName ?? '',
        policyStartDate: existing.policyStartDate?.slice(0, 10) ?? '',
        policyEndDate: existing.policyEndDate?.slice(0, 10) ?? '',
        renewalDate: existing.renewalDate?.slice(0, 10) ?? '',
        policyStatus: existing.policyStatus,
        labourPolicyType: existing.labourPolicyType,
        numberOfEmployees: existing.numberOfEmployees ?? 0,
        wagesPerEmployee: existing.wagesPerEmployee != null ? parseFloat(existing.wagesPerEmployee as string) : 0,
        totalDeclaredWages: existing.totalDeclaredWages != null ? parseFloat(existing.totalDeclaredWages as string) : 0,
        premium: existing.premium != null ? parseFloat(existing.premium as string) : 0,
        cgst: existing.cgst != null ? parseFloat(existing.cgst as string) : 0,
        sgst: existing.sgst != null ? parseFloat(existing.sgst as string) : 0,
        totalPremium: parseFloat(existing.totalPremium) || 0,
        receiptNumber: existing.receiptNumber ?? '',
        receiptDate: existing.receiptDate?.slice(0, 10) ?? '',
        customerType: existing.customerType,
        leadSource: existing.leadSource ?? '',
        remarks: existing.remarks ?? '',
        policyDocument: existing.policyDocument ?? '',
      };
    }
    return { ...EMPTY, ...defaultValues };
  };

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<LabourInsuranceFormValues>({
      resolver: zodResolver(labourInsuranceSchema),
      defaultValues: getInitialValues(),
    });

  const validateDocFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { showError('Only JPG, PNG, WebP, or PDF files are allowed.'); return false; }
    const max = file.type === 'application/pdf' ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > max) { showError(`File too large (${formatBytes(file.size)}). ${file.type === 'application/pdf' ? 'PDF max 5 MB' : 'Image max 1 MB'}.`); return false; }
    return true;
  };

  const storeFileLocally = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !validateDocFile(file)) return;
    pendingFileRef.current = file;
    setPendingLabel(`${file.name} · ${formatBytes(file.size)}`);
    const blobUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(blobUrl);
    setPendingPreview(blobUrl);
  };

  const uploadNow = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !validateDocFile(file)) return;
    setUploading(true);
    try {
      const url = await uploadDocument(file, 'labour-policy');
      setValue('policyDocument', url, { shouldValidate: true });
    } catch (err) { showError(parseApiError(err)); }
    finally { setUploading(false); }
  };

  const onFormSubmit = async (values: LabourInsuranceFormValues) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const finalValues = { ...values };
      if (pendingFileRef.current) {
        const url = await uploadDocument(pendingFileRef.current, 'labour-policy');
        finalValues.policyDocument = url;
      }
      await onSubmit(finalValues);
    } catch (err) { showError(parseApiError(err)); }
    finally { isSubmittingRef.current = false; setSubmitting(false); }
  };

  const uploadedUrl = watch('policyDocument');
  const previewSrc = pendingPreview || (uploadedUrl || undefined);
  const isPdf = pendingPreview ? pendingLabel.toLowerCase().includes('.pdf') : isPdfUrl(uploadedUrl);
  const hasSomething = !!pendingLabel || !!uploadedUrl;
  const hasPending = !!pendingFileRef.current;

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
      {submitting && hasPending && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* ── 1. Company / Insured Details ─────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Company / Insured Details</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Company / Insured Name *" error={!!errors.insuredName}
              helperText={errors.insuredName?.message} {...register('insuredName')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Mobile Number *" error={!!errors.mobileNumber}
              helperText={errors.mobileNumber?.message} {...register('mobileNumber')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Email" error={!!errors.email}
              helperText={errors.email?.message} {...register('email')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="GST Number" placeholder="e.g. 29ABCDE1234F1Z5"
              error={!!errors.gstNumber} helperText={errors.gstNumber?.message}
              {...register('gstNumber')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Business Description" placeholder="e.g. Garment manufacturing"
              error={!!errors.businessDescription} helperText={errors.businessDescription?.message}
              {...register('businessDescription')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="customerType" control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Customer Type" value={field.value} onChange={field.onChange}
                  error={!!errors.customerType} helperText={errors.customerType?.message}
                  options={CUSTOMER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              )} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth multiline rows={2} label="Address"
              error={!!errors.address} helperText={errors.address?.message}
              {...register('address')} />
          </Grid>
        </Grid>
      </Paper>

      {/* ── 2. Policy Details ────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Policy Details</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Policy Number *" error={!!errors.policyNumber}
              helperText={errors.policyNumber?.message} {...register('policyNumber')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="insuranceCompanyName" control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Insurance Company *" value={field.value} onChange={field.onChange}
                  error={!!errors.insuranceCompanyName} helperText={errors.insuranceCompanyName?.message}
                  options={insuranceCompanies.map((c) => ({ value: c.name, label: c.name }))}
                />
              )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="labourPolicyType" control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Labour Policy Type" value={field.value ?? ''} onChange={field.onChange}
                  error={!!errors.labourPolicyType} helperText={errors.labourPolicyType?.message}
                  options={POLICY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="policyStatus" control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Policy Status" value={field.value} onChange={field.onChange}
                  error={!!errors.policyStatus} helperText={errors.policyStatus?.message}
                  options={POLICY_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                />
              )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Intermediary Code"
              error={!!errors.intermediaryCode} helperText={errors.intermediaryCode?.message}
              {...register('intermediaryCode')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Intermediary Name"
              error={!!errors.intermediaryName} helperText={errors.intermediaryName?.message}
              {...register('intermediaryName')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Policy Start Date *" type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.policyStartDate} helperText={errors.policyStartDate?.message}
              {...register('policyStartDate')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Policy End Date *" type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.policyEndDate} helperText={errors.policyEndDate?.message}
              {...register('policyEndDate')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Renewal Date *" type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.renewalDate} helperText={errors.renewalDate?.message}
              {...register('renewalDate')} />
          </Grid>
        </Grid>
      </Paper>

      {/* ── 3. Employee & Wages ──────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Employee &amp; Wages</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Number of Employees" type="number"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              error={!!errors.numberOfEmployees} helperText={errors.numberOfEmployees?.message}
              {...register('numberOfEmployees', { valueAsNumber: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Wages per Employee (₹)" type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              error={!!errors.wagesPerEmployee} helperText={errors.wagesPerEmployee?.message}
              {...register('wagesPerEmployee', { valueAsNumber: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Total Declared Wages (₹)" type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              error={!!errors.totalDeclaredWages} helperText={errors.totalDeclaredWages?.message}
              {...register('totalDeclaredWages', { valueAsNumber: true })} />
          </Grid>
        </Grid>
      </Paper>

      {/* ── 4. Premium ───────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Premium Details</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="Premium (₹)" type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              error={!!errors.premium} helperText={errors.premium?.message}
              {...register('premium', { valueAsNumber: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="CGST (₹)" type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              error={!!errors.cgst} helperText={errors.cgst?.message}
              {...register('cgst', { valueAsNumber: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="SGST (₹)" type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              error={!!errors.sgst} helperText={errors.sgst?.message}
              {...register('sgst', { valueAsNumber: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="Total Premium (₹) *" type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              error={!!errors.totalPremium} helperText={errors.totalPremium?.message}
              {...register('totalPremium', { valueAsNumber: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Receipt Number"
              error={!!errors.receiptNumber} helperText={errors.receiptNumber?.message}
              {...register('receiptNumber')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Receipt Date" type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.receiptDate} helperText={errors.receiptDate?.message}
              {...register('receiptDate')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="leadSource" control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Lead Source" value={field.value ?? ''} onChange={field.onChange}
                  error={!!errors.leadSource} helperText={errors.leadSource?.message}
                  options={leadSources.map((s) => ({ value: s.name, label: s.name }))}
                />
              )} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth multiline rows={2} label="Remarks"
              error={!!errors.remarks} helperText={errors.remarks?.message}
              {...register('remarks')} />
          </Grid>
        </Grid>
      </Paper>

      {/* ── 5. Document Upload ───────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Document Upload</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{
              border: '1px solid',
              borderColor: pendingLabel ? 'warning.main' : uploadedUrl ? 'success.main' : 'divider',
              borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper',
              display: 'flex', flexDirection: 'column', height: '100%',
            }}>
              <Box sx={{
                height: 120, position: 'relative', overflow: 'hidden', flexShrink: 0,
                bgcolor: !previewSrc ? 'grey.50' : isPdf ? 'error.50' : 'grey.100',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {uploading ? (
                  <CircularProgress size={28} />
                ) : !previewSrc ? (
                  <ArticleIcon sx={{ fontSize: 38, color: 'grey.300' }} />
                ) : isPdf ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <ArticleIcon sx={{ fontSize: 40, color: 'error.main' }} />
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'error.dark', letterSpacing: 1 }}>PDF</Typography>
                  </Box>
                ) : (
                  <Box component="img" src={previewSrc} alt="Policy"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
                {uploadedUrl && !uploading && (
                  <Box component="a" href={uploadedUrl} target="_blank" rel="noopener noreferrer"
                    sx={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.45)', color: 'white',
                      textDecoration: 'none', opacity: 0, transition: 'opacity 0.18s', '&:hover': { opacity: 1 },
                    }}>
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Open</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ p: 1.5, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Policy Document</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', lineHeight: 1.2 }}>
                  JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)
                </Typography>
                {pendingLabel ? (
                  <>
                    <Chip icon={<HourglassTopIcon sx={{ fontSize: '14px !important' }} />}
                      label="Ready — uploads on save" size="small" color="warning" variant="outlined" />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.67rem', wordBreak: 'break-all' }}>
                      {pendingLabel}
                    </Typography>
                  </>
                ) : uploadedUrl ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>Uploaded</Typography>
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">Not selected</Typography>
                )}
                <Box sx={{ mt: 'auto', pt: 0.5 }}>
                  <Divider sx={{ mb: 1 }} />
                  <Button component="label" size="small" fullWidth
                    startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />}
                    disabled={uploading || submitting}
                    variant={hasSomething ? 'outlined' : 'contained'}
                    disableElevation>
                    {hasSomething ? 'Change' : 'Select File'}
                    <input hidden type="file" accept="image/*,application/pdf"
                      onChange={existing ? uploadNow : storeFileLocally} />
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" size="large" loading={submitting}>
          {submitting && hasPending ? 'Uploading & Saving…' : submitLabel}
        </LoadingButton>
      </Box>
    </Box>
  );
}

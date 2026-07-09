'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Grid, TextField, MenuItem, Button, Typography,
  Divider, CircularProgress, Paper, Alert, LinearProgress,
  Chip, IconButton,
} from '@mui/material';
import AddIcon         from '@mui/icons-material/Add';
import DeleteIcon      from '@mui/icons-material/Delete';
import UploadFileIcon  from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArticleIcon     from '@mui/icons-material/Article';
import OpenInNewIcon   from '@mui/icons-material/OpenInNew';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { healthInsuranceSchema, HealthInsuranceFormValues } from '../../lib/validations/health-insurance.schema';
import { uploadDocument, UploadType } from '../../lib/api/upload';
import { parseApiError } from '../../lib/parse-error';
import { useToast } from '../../providers/ToastProvider';
import { useLeadSources } from '../../hooks/useLeadSources';
import LoadingButton from '../ui/LoadingButton';
import type { HealthInsuranceRecord } from '../../types/health-insurance.types';

const POLICY_TYPES = [
  { value: 'INDIVIDUAL',       label: 'Individual' },
  { value: 'FAMILY_FLOATER',   label: 'Family Floater' },
  { value: 'SENIOR_CITIZEN',   label: 'Senior Citizen' },
  { value: 'GROUP_INSURANCE',  label: 'Group Insurance' },
  { value: 'CRITICAL_ILLNESS', label: 'Critical Illness' },
] as const;

const POLICY_STATUSES = [
  { value: 'ACTIVE',          label: 'Active' },
  { value: 'EXPIRED',         label: 'Expired' },
  { value: 'PENDING_RENEWAL', label: 'Pending Renewal' },
  { value: 'CANCELLED',       label: 'Cancelled' },
] as const;

const PAYMENT_MODES = [
  { value: 'CASH',          label: 'Cash' },
  { value: 'UPI',           label: 'UPI' },
  { value: 'CARD',          label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
] as const;

const CUSTOMER_TYPES = [
  { value: 'NEW',     label: 'New' },
  { value: 'RENEWAL', label: 'Renewal' },
] as const;

const GENDERS = ['Male', 'Female', 'Other'] as const;

const RELATIONSHIPS = [
  'Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother',
  'Brother', 'Sister', 'Father-in-Law', 'Mother-in-Law', 'Other',
] as const;

interface DocField {
  key: keyof Pick<HealthInsuranceFormValues, 'policyDocument' | 'idProof' | 'medicalDocument'>;
  label: string;
  uploadType: UploadType;
  formats: string;
}

const DOC_FIELDS: DocField[] = [
  { key: 'policyDocument',  label: 'Policy Document', uploadType: 'health-policy',  formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
  { key: 'idProof',         label: 'ID Proof',         uploadType: 'health-id',      formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
  { key: 'medicalDocument', label: 'Medical Document', uploadType: 'health-medical', formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
];

function isPdfUrl(url: string | null | undefined) {
  if (!url) return false;
  return url.endsWith('.pdf') || url.includes('/raw/upload/');
}

function formatBytes(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const EMPTY: HealthInsuranceFormValues = {
  policyNumber: '',
  insuranceCompanyName: '', policyHolderName: '', mobileNumber: '',
  email: '', dateOfBirth: '', gender: '', address: '',
  policyType: 'INDIVIDUAL', policyStartDate: '', policyEndDate: '', renewalDate: '',
  policyStatus: 'ACTIVE', sumInsured: 0, premiumAmount: 0,
  paymentMode: undefined, customerType: 'NEW', leadSource: '', renewalReminderStatus: '',
  remarks: '', nomineeName: '', nomineeRelationship: '', nomineeMobileNumber: '',
  policyDocument: '', idProof: '', medicalDocument: '',
  familyMembers: [],
};

interface Props {
  defaultValues?: Partial<HealthInsuranceFormValues>;
  existing?: HealthInsuranceRecord;
  onSubmit: (values: HealthInsuranceFormValues) => Promise<void>;
  submitLabel?: string;
}

export default function HealthInsuranceForm({ defaultValues, existing, onSubmit, submitLabel = 'Save' }: Props) {
  const { showError } = useToast();
  const { sources: leadSources } = useLeadSources();
  const pendingFilesRef = useRef<Partial<Record<DocField['key'], File>>>({});
  const objectUrlsRef   = useRef<string[]>([]);
  const isSubmittingRef = useRef(false);

  const [pendingLabels,   setPendingLabels]   = useState<Partial<Record<DocField['key'], string>>>({});
  const [pendingPreviews, setPendingPreviews] = useState<Partial<Record<DocField['key'], string>>>({});
  const [submitting,      setSubmitting]      = useState(false);
  const [uploadingField,  setUploadingField]  = useState('');

  useEffect(() => {
    return () => { objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)); };
  }, []);

  const getInitialValues = (): HealthInsuranceFormValues => {
    if (existing) {
      return {
        policyNumber:           existing.policyNumber,
        insuranceCompanyName:   existing.insuranceCompanyName,
        policyHolderName:       existing.policyHolderName,
        mobileNumber:           existing.mobileNumber,
        email:                  existing.email ?? '',
        dateOfBirth:            existing.dateOfBirth?.slice(0, 10) ?? '',
        gender:                 existing.gender ?? '',
        address:                existing.address ?? '',
        policyType:             existing.policyType,
        policyStartDate:        existing.policyStartDate?.slice(0, 10) ?? '',
        policyEndDate:          existing.policyEndDate?.slice(0, 10) ?? '',
        renewalDate:            existing.renewalDate?.slice(0, 10) ?? '',
        policyStatus:           existing.policyStatus,
        sumInsured:             parseFloat(existing.sumInsured) || 0,
        premiumAmount:          parseFloat(existing.premiumAmount) || 0,
        paymentMode:            existing.paymentMode ?? undefined,
        customerType:           existing.customerType,
        leadSource:             existing.leadSource ?? '',
        renewalReminderStatus:  existing.renewalReminderStatus ?? '',
        remarks:                existing.remarks ?? '',
        nomineeName:            existing.nomineeName ?? '',
        nomineeRelationship:    existing.nomineeRelationship ?? '',
        nomineeMobileNumber:    existing.nomineeMobileNumber ?? '',
        policyDocument:         existing.policyDocument ?? '',
        idProof:                existing.idProof ?? '',
        medicalDocument:        existing.medicalDocument ?? '',
        familyMembers: existing.familyMembers.map((m) => ({
          memberName:          m.memberName,
          relationship:        m.relationship,
          dateOfBirth:         m.dateOfBirth?.slice(0, 10) ?? '',
          gender:              m.gender ?? '',
          medicalHistory:      m.medicalHistory ?? '',
          preExistingDisease:  m.preExistingDisease ?? '',
        })),
      };
    }
    return { ...EMPTY, ...defaultValues };
  };

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<HealthInsuranceFormValues>({
      resolver: zodResolver(healthInsuranceSchema),
      defaultValues: getInitialValues(),
    });

  const { fields: memberFields, append: appendMember, remove: removeMember } =
    useFieldArray({ control, name: 'familyMembers' });

  const policyType = watch('policyType');
  const isFamilyFloater = policyType === 'FAMILY_FLOATER';

  const validateDocFile = (file: File): boolean => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      showError('Only JPG, PNG, WebP, or PDF files are allowed.');
      return false;
    }
    const maxBytes = file.type === 'application/pdf' ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxBytes) {
      showError(`File too large (${formatBytes(file.size)}). ${file.type === 'application/pdf' ? 'PDF max 5 MB' : 'Image max 1 MB'}.`);
      return false;
    }
    return true;
  };

  const storeFileLocally = (e: React.ChangeEvent<HTMLInputElement>, field: DocField) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !validateDocFile(file)) return;
    pendingFilesRef.current = { ...pendingFilesRef.current, [field.key]: file };
    setPendingLabels((p) => ({ ...p, [field.key]: `${file.name} · ${formatBytes(file.size)}` }));
    const blobUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(blobUrl);
    setPendingPreviews((p) => ({ ...p, [field.key]: blobUrl }));
  };

  const uploadNow = async (e: React.ChangeEvent<HTMLInputElement>, field: DocField) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !validateDocFile(file)) return;
    setUploadingField(field.key);
    try {
      const url = await uploadDocument(file, field.uploadType);
      setValue(field.key, url, { shouldValidate: true });
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setUploadingField('');
    }
  };

  const onFormSubmit = async (values: HealthInsuranceFormValues) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const finalValues = { ...values };
      for (const [key, file] of Object.entries(pendingFilesRef.current) as [DocField['key'], File][]) {
        const docField = DOC_FIELDS.find((f) => f.key === key)!;
        const url = await uploadDocument(file, docField.uploadType);
        (finalValues as Record<string, unknown>)[key] = url;
      }
      await onSubmit(finalValues);
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const renderDocCard = (f: DocField) => {
    const uploadedUrl  = watch(f.key);
    const pendingLabel = pendingLabels[f.key];
    const pendingPreview = pendingPreviews[f.key];
    const busy         = uploadingField === f.key;
    const hasSomething = !!pendingLabel || !!uploadedUrl;
    const previewSrc   = pendingPreview || (uploadedUrl || undefined);
    const pdf          = pendingPreview
      ? (pendingLabel?.toLowerCase().includes('.pdf') ?? false)
      : isPdfUrl(uploadedUrl);

    return (
      <Grid key={f.key} size={{ xs: 12, sm: 4 }}>
        <Box sx={{
          border: '1px solid',
          borderColor: pendingLabel ? 'warning.main' : uploadedUrl ? 'success.main' : 'divider',
          borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper',
          display: 'flex', flexDirection: 'column', height: '100%',
        }}>
          <Box sx={{
            height: 120, position: 'relative', overflow: 'hidden', flexShrink: 0,
            bgcolor: !previewSrc ? 'grey.50' : pdf ? 'error.50' : 'grey.100',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {busy ? (
              <CircularProgress size={28} />
            ) : !previewSrc ? (
              <UploadFileIcon sx={{ fontSize: 38, color: 'grey.300' }} />
            ) : pdf ? (
              <Box sx={{ textAlign: 'center' }}>
                <ArticleIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'error.dark', letterSpacing: 1 }}>PDF</Typography>
              </Box>
            ) : (
              <Box component="img" src={previewSrc} alt={f.label}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
            {uploadedUrl && !busy && (
              <Box component="a" href={uploadedUrl} target="_blank" rel="noopener noreferrer"
                sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                  bgcolor: 'rgba(0,0,0,0.45)', color: 'white', textDecoration: 'none',
                  opacity: 0, transition: 'opacity 0.18s', '&:hover': { opacity: 1 },
                }}>
                <OpenInNewIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Open</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ p: 1.5, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{f.label}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', lineHeight: 1.2 }}>
              {f.formats}
            </Typography>
            {pendingLabel ? (
              <>
                <Chip icon={<HourglassTopIcon sx={{ fontSize: '14px !important' }} />}
                  label="Ready — uploads on save" size="small" color="warning" variant="outlined" />
                <Typography variant="caption" color="text.secondary"
                  sx={{ fontSize: '0.67rem', lineHeight: 1.3, wordBreak: 'break-all' }}>
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
                startIcon={busy ? <CircularProgress size={14} /> : <UploadFileIcon />}
                disabled={busy || submitting}
                variant={hasSomething ? 'outlined' : 'contained'}
                disableElevation>
                {hasSomething ? 'Change' : 'Select File'}
                <input hidden type="file" accept="image/*,application/pdf"
                  onChange={existing ? (e) => uploadNow(e, f) : (e) => storeFileLocally(e, f)} />
              </Button>
            </Box>
          </Box>
        </Box>
      </Grid>
    );
  };

  const pendingCount = Object.keys(pendingFilesRef.current).length;

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
      {submitting && pendingCount > 0 && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* ── 1. Policy Holder Details ─────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Policy Holder Details</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Policy Holder Name *" error={!!errors.policyHolderName}
              helperText={errors.policyHolderName?.message} {...register('policyHolderName')} />
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
            <TextField fullWidth label="Date of Birth" type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message}
              {...register('dateOfBirth')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="gender" control={control}
              render={({ field }) => (
                <TextField fullWidth select label="Gender" error={!!errors.gender} helperText={errors.gender?.message} {...field}>
                  <MenuItem value="">Select Gender</MenuItem>
                  {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
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
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Policy Details</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Policy Number *" error={!!errors.policyNumber}
              helperText={errors.policyNumber?.message} {...register('policyNumber')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Insurance Company *" error={!!errors.insuranceCompanyName}
              helperText={errors.insuranceCompanyName?.message} {...register('insuranceCompanyName')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="policyType" control={control}
              render={({ field }) => (
                <TextField fullWidth select label="Policy Type *" error={!!errors.policyType}
                  helperText={errors.policyType?.message} {...field}>
                  {POLICY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="policyStatus" control={control}
              render={({ field }) => (
                <TextField fullWidth select label="Policy Status" error={!!errors.policyStatus}
                  helperText={errors.policyStatus?.message} {...field}>
                  {POLICY_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </TextField>
              )} />
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

      {/* ── 3. Coverage & Payment ────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Coverage &amp; Payment</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="Sum Insured (₹) *" type="number"
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
              error={!!errors.sumInsured} helperText={errors.sumInsured?.message}
              {...register('sumInsured', { valueAsNumber: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="Premium Amount (₹) *" type="number"
              slotProps={{ htmlInput: { min: 0, step: 100 } }}
              error={!!errors.premiumAmount} helperText={errors.premiumAmount?.message}
              {...register('premiumAmount', { valueAsNumber: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller name="paymentMode" control={control}
              render={({ field }) => (
                <TextField fullWidth select label="Payment Mode" error={!!errors.paymentMode}
                  helperText={errors.paymentMode?.message} {...field} value={field.value ?? ''}>
                  <MenuItem value="">Select Mode</MenuItem>
                  {PAYMENT_MODES.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </TextField>
              )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller name="customerType" control={control}
              render={({ field }) => (
                <TextField fullWidth select label="Customer Type" error={!!errors.customerType}
                  helperText={errors.customerType?.message} {...field}>
                  {CUSTOMER_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller name="leadSource" control={control}
              render={({ field }) => (
                <TextField fullWidth select label="Lead Source"
                  error={!!errors.leadSource} helperText={errors.leadSource?.message}
                  {...field} value={field.value ?? ''}>
                  <MenuItem value="">Select Lead Source</MenuItem>
                  {leadSources.map((s) => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
                </TextField>
              )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Renewal Reminder Status" placeholder="e.g. Sent, Pending"
              error={!!errors.renewalReminderStatus} helperText={errors.renewalReminderStatus?.message}
              {...register('renewalReminderStatus')} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField fullWidth multiline rows={2} label="Remarks"
              error={!!errors.remarks} helperText={errors.remarks?.message}
              {...register('remarks')} />
          </Grid>
        </Grid>
      </Paper>

      {/* ── 4. Nominee Details ───────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Nominee Details</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Nominee Name"
              error={!!errors.nomineeName} helperText={errors.nomineeName?.message}
              {...register('nomineeName')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Relationship"
              error={!!errors.nomineeRelationship} helperText={errors.nomineeRelationship?.message}
              {...register('nomineeRelationship')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Nominee Mobile"
              error={!!errors.nomineeMobileNumber} helperText={errors.nomineeMobileNumber?.message}
              {...register('nomineeMobileNumber')} />
          </Grid>
        </Grid>
      </Paper>

      {/* ── 5. Family Members (Family Floater only) ──────────────── */}
      {isFamilyFloater && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Family Members</Typography>
            <Button size="small" variant="outlined" startIcon={<AddIcon />}
              onClick={() => appendMember({ memberName: '', relationship: '', dateOfBirth: '', gender: '', medicalHistory: '', preExistingDisease: '' })}>
              Add Member
            </Button>
          </Box>

          {memberFields.length === 0 && (
            <Alert severity="info" sx={{ mb: 1 }}>
              No family members added. Click "Add Member" to add covered family members.
            </Alert>
          )}

          {memberFields.map((field, index) => (
            <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Member {index + 1}</Typography>
                <IconButton size="small" color="error" onClick={() => removeMember(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField fullWidth label="Member Name *"
                    error={!!errors.familyMembers?.[index]?.memberName}
                    helperText={errors.familyMembers?.[index]?.memberName?.message}
                    {...register(`familyMembers.${index}.memberName`)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Controller name={`familyMembers.${index}.relationship`} control={control}
                    render={({ field: f }) => (
                      <TextField fullWidth select label="Relationship *"
                        error={!!errors.familyMembers?.[index]?.relationship}
                        helperText={errors.familyMembers?.[index]?.relationship?.message} {...f}>
                        {RELATIONSHIPS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                      </TextField>
                    )} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField fullWidth label="Date of Birth" type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    {...register(`familyMembers.${index}.dateOfBirth`)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Controller name={`familyMembers.${index}.gender`} control={control}
                    render={({ field: f }) => (
                      <TextField fullWidth select label="Gender" {...f} value={f.value ?? ''}>
                        <MenuItem value="">Select</MenuItem>
                        {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                      </TextField>
                    )} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Pre-existing Disease"
                    {...register(`familyMembers.${index}.preExistingDisease`)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth multiline rows={2} label="Medical History"
                    {...register(`familyMembers.${index}.medicalHistory`)} />
                </Grid>
              </Grid>
            </Box>
          ))}
        </Paper>
      )}

      {/* ── 6. Document Upload ───────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Document Upload</Typography>
        <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
          {DOC_FIELDS.map(renderDocCard)}
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" size="large" loading={submitting}>
          {submitting && pendingCount > 0 ? 'Uploading & Saving…' : submitLabel}
        </LoadingButton>
      </Box>
    </Box>
  );
}

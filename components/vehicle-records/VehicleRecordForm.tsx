'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Grid, TextField, MenuItem, Button, Typography,
  Divider, CircularProgress, Paper, Alert, LinearProgress, Chip,
} from '@mui/material';
import UploadFileIcon   from '@mui/icons-material/UploadFile';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import RestoreIcon      from '@mui/icons-material/Restore';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ArticleIcon      from '@mui/icons-material/Article';
import OpenInNewIcon    from '@mui/icons-material/OpenInNew';
import { vehicleRecordSchema, VehicleRecordFormValues } from '../../lib/validations/vehicle-record.schema';
import { uploadDocument, UploadType } from '../../lib/api/upload';
import { categoriesApi } from '../../lib/api/categories';
import { parseApiError } from '../../lib/parse-error';
import { useToast }     from '../../providers/ToastProvider';
import { useFormDraft } from '../../hooks/useFormDraft';
import LoadingButton    from '../ui/LoadingButton';
import type { VehicleRecord, VehicleCategory } from '../../types/vehicle-record.types';

const DRAFT_KEY = 'a2_add_vehicle_draft';

interface DocField {
  key: keyof Pick<VehicleRecordFormValues,
    'rcDocument'|'insuranceDocument'|'aadhaarDocument'|'panDocument'|'photo'|'odDocument'|'tpDocument'>;
  label: string;
  uploadType: UploadType;
  accept: string;
  allowedMime: string[];
  formats: string;
}

const DOC_FIELDS: DocField[] = [
  { key: 'rcDocument',        label: 'RC Document',    uploadType: 'rc',        accept: 'image/*,application/pdf', allowedMime: ['image/jpeg','image/png','image/webp','application/pdf'], formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
  { key: 'insuranceDocument', label: 'Insurance Copy', uploadType: 'insurance', accept: 'image/*,application/pdf', allowedMime: ['image/jpeg','image/png','image/webp','application/pdf'], formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
  { key: 'odDocument',        label: 'OD Document',    uploadType: 'od',        accept: 'image/*,application/pdf', allowedMime: ['image/jpeg','image/png','image/webp','application/pdf'], formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
  { key: 'tpDocument',        label: 'TP Document',    uploadType: 'tp',        accept: 'image/*,application/pdf', allowedMime: ['image/jpeg','image/png','image/webp','application/pdf'], formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
  { key: 'aadhaarDocument',   label: 'Aadhaar Front',  uploadType: 'aadhaar',   accept: 'image/*,application/pdf', allowedMime: ['image/jpeg','image/png','image/webp','application/pdf'], formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
  { key: 'panDocument',       label: 'Aadhaar Back',   uploadType: 'aadhaar',   accept: 'image/*,application/pdf', allowedMime: ['image/jpeg','image/png','image/webp','application/pdf'], formats: 'JPG / PNG / WebP (max 1 MB)  or  PDF (max 5 MB)' },
  { key: 'photo',             label: 'Vehicle Photo',  uploadType: 'photo',     accept: 'image/*',                 allowedMime: ['image/jpeg','image/png','image/webp'],                   formats: 'JPG / PNG / WebP only (max 1 MB)' },
];

const EMPTY: VehicleRecordFormValues = {
  vehicleNumber: '', ownerName: '', cellNumber: '', cellNumberAlt: '', category: '',
  policyExpiryDate: '', insuranceCompany: '',
  rcDocument: '', insuranceDocument: '', aadhaarDocument: '', panDocument: '', photo: '',
  odDocument: '', tpDocument: '',
};

function formatBytes(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.endsWith('.pdf') || url.includes('/raw/upload/');
}

function getPdfThumbnailUrl(url: string): string {
  return url.replace('/raw/upload/', '/image/upload/pg_1,w_400,q_auto,f_jpg/');
}

interface Props {
  defaultValues?: Partial<VehicleRecordFormValues>;
  existing?: VehicleRecord;
  onSubmit: (values: VehicleRecordFormValues) => Promise<void>;
  submitLabel?: string;
  enableDraft?: boolean;
}

export default function VehicleRecordForm({
  defaultValues, existing, onSubmit, submitLabel = 'Save', enableDraft = false,
}: Props) {
  const { showError } = useToast();
  const draft = useFormDraft<VehicleRecordFormValues>(DRAFT_KEY);

  // Files stored locally before upload (Add mode)
  const pendingFilesRef  = useRef<Partial<Record<DocField['key'], File>>>({});
  const isSubmittingRef  = useRef(false);
  const objectUrlsRef    = useRef<string[]>([]); // tracked for cleanup on unmount

  const [pendingLabels,   setPendingLabels]   = useState<Partial<Record<DocField['key'], string>>>({});
  const [pendingPreviews, setPendingPreviews] = useState<Partial<Record<DocField['key'], string>>>({});
  const [pdfThumbErrors,  setPdfThumbErrors]  = useState<Partial<Record<DocField['key'], boolean>>>({});
  const [submitting,      setSubmitting]      = useState(false);
  const [uploadingField,  setUploadingField]  = useState('');
  const [categories,      setCategories]      = useState<VehicleCategory[]>([]);
  const [draftRestored,   setDraftRestored]   = useState(false);

  // Revoke all blob URLs when the component unmounts
  useEffect(() => {
    return () => { objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)); };
  }, []);

  const getInitialValues = (): VehicleRecordFormValues => {
    if (existing) {
      return {
        vehicleNumber:     existing.vehicleNumber,
        ownerName:         existing.ownerName,
        cellNumber:        existing.cellNumber,
        cellNumberAlt:     existing.cellNumberAlt ?? '',
        category:          existing.category,
        policyExpiryDate:  existing.policyExpiryDate?.slice(0, 10) ?? '',
        insuranceCompany:  existing.insuranceCompany,
        rcDocument:        existing.rcDocument        ?? '',
        insuranceDocument: existing.insuranceDocument ?? '',
        aadhaarDocument:   existing.aadhaarDocument   ?? '',
        panDocument:       existing.panDocument        ?? '',
        photo:             existing.photo              ?? '',
        odDocument:        existing.odDocument         ?? '',
        tpDocument:        existing.tpDocument         ?? '',
      };
    }
    if (enableDraft) {
      const saved = draft.load();
      if (saved) return saved;
    }
    return { ...EMPTY, ...defaultValues };
  };

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<VehicleRecordFormValues>({
      resolver: zodResolver(vehicleRecordSchema),
      defaultValues: getInitialValues(),
    });

  useEffect(() => {
    if (enableDraft && !existing && draft.exists()) setDraftRestored(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enableDraft || existing) return;
    const sub = watch((values) => draft.save(values as VehicleRecordFormValues));
    return () => sub.unsubscribe();
  }, [watch, enableDraft, existing, draft]);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  const clearAllBlobUrls = () => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
  };

  const discardDraft = () => {
    draft.clear();
    reset({ ...EMPTY, ...defaultValues });
    pendingFilesRef.current = {};
    setPendingLabels({});
    clearAllBlobUrls();
    setPendingPreviews({});
    setDraftRestored(false);
  };

  // ── ADD mode: store file locally, create blob URL for preview ──────────────
  const validateFile = (file: File, field: DocField): boolean => {
    if (!field.allowedMime.includes(file.type)) {
      showError(`"${field.label}" only accepts: ${field.formats}.`);
      return false;
    }
    const isPdf    = file.type === 'application/pdf';
    const maxBytes = isPdf ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxBytes) {
      showError(`File too large (${formatBytes(file.size)}). ${isPdf ? 'PDF max 5 MB' : 'Image max 1 MB'}.`);
      return false;
    }
    return true;
  };

  const storeFileLocally = (e: React.ChangeEvent<HTMLInputElement>, field: DocField) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!validateFile(file, field)) return;
    pendingFilesRef.current = { ...pendingFilesRef.current, [field.key]: file };
    setPendingLabels((p) => ({ ...p, [field.key]: `${file.name} · ${formatBytes(file.size)}` }));

    const blobUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(blobUrl);
    setPendingPreviews((p) => ({ ...p, [field.key]: blobUrl }));
  };

  // ── EDIT mode: upload immediately and set URL in form ──────────────────────
  const uploadNow = async (e: React.ChangeEvent<HTMLInputElement>, field: DocField) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!validateFile(file, field)) return;
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

  // ── Submit (Add mode: upload all pending, then create record) ──────────────
  const onFormSubmit = async (values: VehicleRecordFormValues) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const finalValues = { ...values };
      const pending = Object.entries(pendingFilesRef.current) as [DocField['key'], File][];

      for (const [key, file] of pending) {
        const docField = DOC_FIELDS.find((f) => f.key === key)!;
        const url = await uploadDocument(file, docField.uploadType);
        (finalValues as Record<string, string>)[key] = url;
      }

      await onSubmit(finalValues);
      if (enableDraft) {
        draft.clear();
        pendingFilesRef.current = {};
        setPendingLabels({});
        clearAllBlobUrls();
        setPendingPreviews({});
      }
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  // ── Document card renderer ─────────────────────────────────────────────────
  const renderDocCard = (f: DocField) => {
    const uploadedUrl    = watch(f.key);
    const pendingLabel   = pendingLabels[f.key];
    const pendingPreview = pendingPreviews[f.key];
    const busyUpload     = uploadingField === f.key;
    const hasSomething   = !!pendingLabel || !!uploadedUrl;

    // Preview source: blob URL for pending files, Cloudinary URL for uploaded
    const previewSrc = pendingPreview || (uploadedUrl || undefined);
    const pdf = pendingPreview
      ? (pendingLabel?.toLowerCase().includes('.pdf') ?? false)
      : isPdfUrl(uploadedUrl);
    // Cloudinary thumbnail for already-uploaded PDFs (blob URLs can't be thumbnailed)
    const pdfThumbUrl = !pendingPreview && pdf && uploadedUrl ? getPdfThumbnailUrl(uploadedUrl) : null;
    const pdfThumbFailed = !!pdfThumbErrors[f.key];

    return (
      <Grid key={f.key} size={{ xs: 12, sm: 6, md: 4 }}>
        <Box sx={{
          border: '1px solid',
          borderColor: pendingLabel ? 'warning.main' : uploadedUrl ? 'success.main' : 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>

          {/* ── Thumbnail / preview area ───────────────────────── */}
          <Box sx={{
            height: 120,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            bgcolor: !previewSrc ? 'grey.50' : pdf ? 'error.50' : 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {busyUpload ? (
              <CircularProgress size={30} />
            ) : !previewSrc ? (
              <UploadFileIcon sx={{ fontSize: 44, color: 'grey.300' }} />
            ) : pdf && pdfThumbUrl && !pdfThumbFailed ? (
              <Box
                component="img"
                src={pdfThumbUrl}
                alt={f.label}
                onError={() => setPdfThumbErrors((p) => ({ ...p, [f.key]: true }))}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : pdf ? (
              <Box sx={{ textAlign: 'center' }}>
                <ArticleIcon sx={{ fontSize: 48, color: 'error.main' }} />
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'error.dark', letterSpacing: 1, mt: 0.25 }}>
                  PDF
                </Typography>
              </Box>
            ) : (
              <Box
                component="img"
                src={previewSrc}
                alt={f.label}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}

            {/* Hover overlay — "Open" link for stable uploaded URLs only */}
            {uploadedUrl && !busyUpload && (
              <Box
                component="a"
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                  bgcolor: 'rgba(0,0,0,0.45)',
                  color: 'white',
                  textDecoration: 'none',
                  opacity: 0,
                  transition: 'opacity 0.18s',
                  '&:hover': { opacity: 1 },
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Open</Typography>
              </Box>
            )}
          </Box>

          {/* ── Info + button ──────────────────────────────────── */}
          <Box sx={{
            p: 1.5,
            textAlign: 'center',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{f.label}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', lineHeight: 1.2 }}>
              {f.formats}
            </Typography>

            {pendingLabel ? (
              <>
                <Chip
                  icon={<HourglassTopIcon sx={{ fontSize: '14px !important' }} />}
                  label="Ready — uploads on save"
                  size="small" color="warning" variant="outlined"
                />
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
              <Button
                component="label" size="small" fullWidth
                startIcon={busyUpload ? <CircularProgress size={14} /> : <UploadFileIcon />}
                disabled={busyUpload || submitting}
                variant={hasSomething ? 'outlined' : 'contained'}
                disableElevation
              >
                {hasSomething ? 'Change' : 'Select File'}
                <input
                  hidden type="file" accept={f.accept}
                  onChange={enableDraft ? (e) => storeFileLocally(e, f) : (e) => uploadNow(e, f)}
                />
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
      {draftRestored && (
        <Alert severity="info" icon={<RestoreIcon fontSize="small" />} sx={{ mb: 3 }}
          action={<Button size="small" color="inherit" onClick={discardDraft}>Discard</Button>}>
          Your previous unsaved entries have been restored. Click <strong>Discard</strong> to start fresh.
        </Alert>
      )}

      {enableDraft && Object.keys(pendingLabels).length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {Object.keys(pendingLabels).length} file{Object.keys(pendingLabels).length > 1 ? 's' : ''} selected —
          will be uploaded when you click <strong>{submitLabel}</strong>.
        </Alert>
      )}

      {submitting && pendingCount > 0 && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Vehicle Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Vehicle Information</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="Vehicle Number" error={!!errors.vehicleNumber} helperText={errors.vehicleNumber?.message}
              {...register('vehicleNumber')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="Owner Name" error={!!errors.ownerName} helperText={errors.ownerName?.message}
              {...register('ownerName')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="Primary Number" error={!!errors.cellNumber} helperText={errors.cellNumber?.message}
              {...register('cellNumber')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth label="Secondary Number" error={!!errors.cellNumberAlt} helperText={errors.cellNumberAlt?.message}
              placeholder="Optional"
              {...register('cellNumberAlt')} />
          </Grid>
        </Grid>
      </Paper>

      {/* Policy Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Policy Information</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="category" control={control}
              render={({ field }) => (
                <TextField fullWidth select label="Category" error={!!errors.category} helperText={errors.category?.message} {...field}>
                  {categories.length === 0 && <MenuItem value="" disabled>Loading…</MenuItem>}
                  {categories.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Policy Expiry Date" type="date" slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.policyExpiryDate} helperText={errors.policyExpiryDate?.message}
              {...register('policyExpiryDate')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Insurance Company" error={!!errors.insuranceCompany} helperText={errors.insuranceCompany?.message}
              {...register('insuranceCompany')} />
          </Grid>
        </Grid>
      </Paper>

      {/* Document Upload */}
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

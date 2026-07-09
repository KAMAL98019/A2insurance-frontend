'use client';

import { useState } from 'react';
import {
  Box, Popover, Typography, Chip, Divider,
} from '@mui/material';
import ArticleIcon              from '@mui/icons-material/Article';
import FolderOffIcon            from '@mui/icons-material/FolderOff';
import FolderOpenIcon           from '@mui/icons-material/FolderOpen';
import OpenInNewIcon            from '@mui/icons-material/OpenInNew';
import type { HealthInsuranceRecord } from '../../types/health-insurance.types';

interface Doc { label: string; url: string | null }

const DOC_META: Array<{ key: keyof HealthInsuranceRecord; label: string }> = [
  { key: 'policyDocument',  label: 'Policy Doc'  },
  { key: 'idProof',         label: 'ID Proof'    },
  { key: 'medicalDocument', label: 'Medical Doc' },
];

function getPdfThumbnailUrl(url: string): string {
  return url.replace('/raw/upload/', '/image/upload/pg_1,w_300,q_auto,f_jpg/');
}

function getPdfInlineUrl(url: string): string {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return `${api}/upload/pdf?url=${encodeURIComponent(url)}`;
}

function DocCard({ doc }: { doc: Doc }) {
  const [thumbError, setThumbError] = useState(false);
  const isPdf = !!doc.url && (doc.url.endsWith('.pdf') || doc.url.includes('/raw/upload/'));
  const thumbUrl = isPdf && doc.url ? getPdfThumbnailUrl(doc.url) : null;

  const handleClick = () => {
    if (!doc.url) return;
    const openUrl = isPdf ? getPdfInlineUrl(doc.url) : doc.url;
    window.open(openUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        width: 88,
        border: '1px solid',
        borderColor: !doc.url ? 'grey.200' : isPdf ? 'error.200' : 'primary.200',
        borderRadius: 2,
        overflow: 'hidden',
        opacity: doc.url ? 1 : 0.45,
        cursor: doc.url ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'box-shadow 0.15s, transform 0.12s',
        '&:hover': doc.url ? {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          borderColor: isPdf ? 'error.main' : 'primary.main',
        } : {},
      }}
    >
      <Box sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: !doc.url ? 'grey.100' : isPdf && (thumbError || !thumbUrl) ? 'error.50' : 'primary.50',
        overflow: 'hidden',
      }}>
        {!doc.url ? (
          <FolderOffIcon sx={{ fontSize: 28, color: 'grey.400' }} />
        ) : isPdf && thumbUrl && !thumbError ? (
          <Box
            component="img"
            src={thumbUrl}
            alt={doc.label}
            loading="lazy"
            onError={() => setThumbError(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : isPdf ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
            <ArticleIcon sx={{ fontSize: 30, color: 'error.main' }} />
            <Typography sx={{ fontSize: '0.55rem', color: 'error.dark', fontWeight: 700, letterSpacing: 0.5 }}>
              PDF
            </Typography>
          </Box>
        ) : (
          <Box
            component="img"
            src={doc.url}
            alt={doc.label}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </Box>

      <Box sx={{
        px: 0.75, py: 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: 'background.paper',
      }}>
        <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
          {doc.label}
        </Typography>
        {doc.url && <OpenInNewIcon sx={{ fontSize: 10, color: 'text.disabled' }} />}
      </Box>
    </Box>
  );
}

export default function HealthDocumentCell({ record }: { record: HealthInsuranceRecord }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const docs: Doc[] = DOC_META.map(({ key, label }) => ({
    label,
    url: record[key] as string | null,
  }));

  const uploaded = docs.filter((d) => d.url).length;

  return (
    <>
      <Chip
        icon={<FolderOpenIcon sx={{ fontSize: '14px !important' }} />}
        label={`${uploaded} / 3`}
        size="small"
        variant="outlined"
        color={uploaded === 3 ? 'success' : uploaded > 0 ? 'warning' : 'default'}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ cursor: 'pointer', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
      />

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2.5, boxShadow: 8, mt: 0.5, maxWidth: 'calc(100vw - 24px)' } } }}
      >
        <Box sx={{ p: 2, width: { xs: 'calc(100vw - 24px)', sm: 300 }, maxWidth: 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Documents
            </Typography>
            <Chip
              label={`${uploaded} of 3 uploaded`}
              size="small"
              color={uploaded === 3 ? 'success' : uploaded > 0 ? 'warning' : 'default'}
            />
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {docs.map((doc) => <DocCard key={doc.label} doc={doc} />)}
          </Box>

          {uploaded > 0 && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}
            >
              Click any document to open in a new tab
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}

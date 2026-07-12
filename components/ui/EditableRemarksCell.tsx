'use client';

import { useState } from 'react';
import { Box, IconButton, TextField, Tooltip, Typography, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useToast } from '../../providers/ToastProvider';
import { parseApiError } from '../../lib/parse-error';

interface Props {
  value: string | null;
  onSave: (value: string) => Promise<unknown>;
  canEdit: boolean;
}

// Click-to-edit remarks cell shared by the Vehicle/Health/Fire/Labour tables —
// saves inline via the caller's onSave, no navigation to the edit page needed.
// Keeps its own committed value locally (like the renewal cells elsewhere in
// this codebase) so the displayed text updates immediately after a save,
// instead of reverting to the stale value from the parent's records list
// until the next full refetch.
export default function EditableRemarksCell({ value, onSave, canEdit }: Props) {
  const { showError } = useToast();
  const [committed, setCommitted] = useState(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(committed ?? '');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(committed ?? '');
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setCommitted(draft);
      setEditing(false);
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, minWidth: 200 }}>
        <TextField
          size="small" value={draft} onChange={(e) => setDraft(e.target.value)}
          autoFocus multiline maxRows={4}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
            if (e.key === 'Escape') cancel();
          }}
          sx={{ flex: 1 }}
        />
        <IconButton size="small" color="success" onClick={save} disabled={saving}>
          {saving ? <CircularProgress size={14} /> : <CheckIcon fontSize="small" />}
        </IconButton>
        <IconButton size="small" color="error" onClick={cancel} disabled={saving}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      onClick={() => canEdit && startEdit()}
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        cursor: canEdit ? 'pointer' : 'default',
        minWidth: 120, maxWidth: 220,
        '&:hover .edit-hint': { opacity: canEdit ? 1 : 0 },
      }}
    >
      <Typography
        variant="body2"
        color={committed ? 'text.primary' : 'text.disabled'}
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
      >
        {committed || (canEdit ? 'Add remarks…' : '—')}
      </Typography>
      {canEdit && (
        <Tooltip title="Edit remarks">
          <EditIcon className="edit-hint" sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }} />
        </Tooltip>
      )}
    </Box>
  );
}

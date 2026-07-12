'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { notificationsApi } from '../../lib/api/notifications';
import { useToast } from '../../providers/ToastProvider';
import { parseApiError } from '../../lib/parse-error';
import type { SendManualPayload } from '../../types/notification.types';

export type WaLang = 'english' | 'tamil';

type SendIdKey = 'vehicleRecordId' | 'healthInsuranceId' | 'fireInsuranceId' | 'labourInsuranceId';

interface Props<T extends { id: number }> {
  target: T | null;
  onClose: () => void;
  titleLabel: (target: T) => string;
  getPhone: (target: T) => string;
  buildMessage: (target: T, lang: WaLang) => string;
  sendPayloadKey: SendIdKey;
}

// Shared "compose & send" dialog reused by Health/Fire/Labour tables — same
// UX as the vehicle table's WhatsApp button, minus the multi-number picker
// step (those modules only ever have a single mobile number).
export default function WhatsAppSendDialog<T extends { id: number }>({
  target, onClose, titleLabel, getPhone, buildMessage, sendPayloadKey,
}: Props<T>) {
  const { showSuccess, showError } = useToast();
  const [phone,   setPhone]   = useState('');
  const [message, setMessage] = useState('');
  const [lang,    setLang]    = useState<WaLang>('english');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (target) {
      setLang('english');
      setPhone(getPhone(target));
      setMessage(buildMessage(target, 'english'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const switchLang = (l: WaLang) => {
    setLang(l);
    if (target) setMessage(buildMessage(target, l));
  };

  const handleSend = async () => {
    if (!target) return;
    setSending(true);
    try {
      const payload: SendManualPayload = { mobileNumber: phone, message, [sendPayloadKey]: target.id };
      const res = await notificationsApi.sendManual(payload);
      if (res.success) {
        showSuccess(`WhatsApp sent to ${phone}`);
        onClose();
      } else {
        const isNotConnected = res.message?.toLowerCase().includes('not connected');
        showError(isNotConnected
          ? 'WhatsApp is not connected. Go to Settings → WhatsApp Connection to scan the QR code.'
          : `Send failed: ${res.message}`);
      }
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={Boolean(target)} onClose={() => !sending && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WhatsAppIcon sx={{ color: '#25D366' }} />
        Send WhatsApp Message
      </DialogTitle>

      <DialogContent sx={{ pt: '12px !important' }}>
        {target && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">To</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{titleLabel(target)}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {(['english', 'tamil'] as const).map((l) => (
            <Box
              key={l}
              onClick={() => switchLang(l)}
              sx={{
                px: 1.5, py: 0.5, borderRadius: 5, cursor: 'pointer',
                border: '1.5px solid',
                borderColor: lang === l ? 'primary.main' : 'divider',
                bgcolor: lang === l ? 'primary.50' : 'transparent',
                color: lang === l ? 'primary.main' : 'text.secondary',
                fontSize: '0.75rem', fontWeight: lang === l ? 700 : 400,
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
            >
              {l === 'english' ? '🇬🇧 English' : '🇮🇳 தமிழ்'}
            </Box>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
          Mobile Number
        </Typography>
        <TextField
          fullWidth size="small" sx={{ mb: 2 }}
          value={phone} onChange={(e) => setPhone(e.target.value)}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
          Message
        </Typography>
        <TextField
          fullWidth multiline rows={4} size="small"
          value={message} onChange={(e) => setMessage(e.target.value)}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={sending}>Cancel</Button>
        <Button
          variant="contained" disableElevation onClick={handleSend}
          disabled={sending || !phone.trim() || !message.trim()}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
          sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' } }}
        >
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

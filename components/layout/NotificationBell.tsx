'use client';

import { useState } from 'react';
import {
  IconButton, Badge, Popover, Box, Typography, List, ListItem,
  Divider, Button, Tooltip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import ErrorIcon         from '@mui/icons-material/Error';
import WarningIcon       from '@mui/icons-material/Warning';
import InfoIcon          from '@mui/icons-material/Info';
import WhatsAppIcon      from '@mui/icons-material/WhatsApp';
import { useAppNotifications, type AppNotif } from '../../providers/AppNotificationsProvider';

const SEVERITY_COLOR = {
  success: '#2e7d32',
  error:   '#c62828',
  warning: '#e65100',
  info:    '#1565c0',
};

const SEVERITY_BG = {
  success: '#f0fdf4',
  error:   '#fff5f5',
  warning: '#fff8f0',
  info:    '#eff6ff',
};

function SeverityIcon({ severity }: { severity: AppNotif['severity'] }) {
  const props = { fontSize: 'small' as const, sx: { color: SEVERITY_COLOR[severity] } };
  if (severity === 'success') return <CheckCircleIcon {...props} />;
  if (severity === 'error')   return <ErrorIcon {...props} />;
  if (severity === 'warning') return <WarningIcon {...props} />;
  return <InfoIcon {...props} />;
}

function typeIcon(type: string) {
  if (type.startsWith('whatsapp_')) return <WhatsAppIcon sx={{ fontSize: 13, color: '#25D366' }} />;
  return null;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll } = useAppNotifications();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(e.currentTarget);
    markAllRead();
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleOpen} size="small" sx={{ mr: 1 }}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon sx={{ color: 'text.secondary' }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxHeight: 520, borderRadius: 2, boxShadow: 6 } } }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Button size="small" onClick={clearAll} sx={{ fontSize: '0.7rem', minWidth: 0 }}>
              Clear all
            </Button>
          )}
        </Box>

        {/* List */}
        {notifications.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ overflowY: 'auto', maxHeight: 420 }}>
            {notifications.map((n, i) => (
              <Box key={n.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 2, py: 1.25, gap: 1.5,
                    bgcolor: SEVERITY_BG[n.severity],
                    borderLeft: `3px solid ${SEVERITY_COLOR[n.severity]}`,
                    '&:hover': { filter: 'brightness(0.97)' },
                  }}
                >
                  <Box sx={{ pt: 0.25, flexShrink: 0 }}>
                    <SeverityIcon severity={n.severity} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                      {typeIcon(n.type)}
                      <Typography variant="caption" sx={{ fontWeight: 700, color: SEVERITY_COLOR[n.severity] }}>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto', flexShrink: 0 }}>
                        {timeAgo(n.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                      {n.message}
                    </Typography>
                  </Box>
                </ListItem>
                {i < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}

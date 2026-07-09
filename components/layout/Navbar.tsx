'use client';

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/useAuth';
import { SIDEBAR_WIDTH } from './Sidebar';
import NotificationBell from './NotificationBell';
import LocationSwitcher from './LocationSwitcher';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
        bgcolor: '#fff',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, color: 'text.primary' }}>
          A2 Insurance Care
        </Typography>

        <LocationSwitcher />

        {user?.role === 'MASTER_ADMIN' && (
          <Chip label="Master Admin" size="small" color="primary" sx={{ mr: 1, fontWeight: 600 }} />
        )}
        {user?.role === 'SUPER_ADMIN' && (
          <Chip label="Super Admin" size="small" color="secondary" sx={{ mr: 1, fontWeight: 600 }} />
        )}

        <NotificationBell />

        <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.875rem' }}>
            {initials}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 200, borderRadius: 2 } } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => setAnchor(null)} sx={{ gap: 1.5, py: 1.5 }}>
            <PersonIcon fontSize="small" />
            <Typography variant="body2">My Profile</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => { setAnchor(null); logout(); }}
            sx={{ gap: 1.5, py: 1.5, color: 'error.main' }}
          >
            <LogoutIcon fontSize="small" />
            <Typography variant="body2">Sign Out</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

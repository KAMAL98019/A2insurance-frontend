'use client';

import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import { AppNotificationsProvider } from '../../providers/AppNotificationsProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppNotificationsProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
        <Navbar onMenuClick={() => setMobileOpen((o) => !o)} />
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Toolbar />
          <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
        </Box>
      </Box>
    </AppNotificationsProvider>
  );
}

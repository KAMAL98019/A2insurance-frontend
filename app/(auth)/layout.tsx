import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import TruckBackground from '../../components/auth/TruckBackground';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Left panel (tablet+) ── */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: { sm: '45%', md: '50%' },
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #0d1b6e 0%, #1a2980 40%, #1a3a8f 70%, #0a3060 100%)',
          p: 5,
          color: '#fff',
        }}
      >
        <TruckBackground />

        {/* Logo */}
        <Box sx={{ zIndex: 1, display: 'flex', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/companylogo.png" alt="A2 Insurance" style={{ height: 90, width: 'auto', display: 'block', objectFit: 'contain' }} />
        </Box>

        {/* Hero text */}
        <Box sx={{ zIndex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 2, color: '#fff' }}>
            Authoritative Coverage for Modern Fleets
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 400, color: '#fff' }}>
            Access rigorous policy management, automated compliance tracking, and immediate claims
            resolution in one centralized platform. Designed for precision and speed.
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', zIndex: 1, opacity: 0.7 }}>
          <Typography variant="caption">© 2026 A2 Insurance Management</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" sx={{ cursor: 'pointer', '&:hover': { opacity: 1 } }}>Privacy Policy</Typography>
            <Typography variant="caption" sx={{ cursor: 'pointer', '&:hover': { opacity: 1 } }}>Terms of Service</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Right panel ── */}
      {/* On sm+: white centered panel (unchanged) */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          p: { sm: 4, md: 6 },
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>{children}</Box>
      </Box>

      {/* On xs: full-page mobile layout */}
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: '#f0f2f8',
          p: 2,
        }}
      >
        {/* Card */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            bgcolor: '#fff',
          }}
        >
          {/* Brand strip */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              py: 2.5,
              background: 'linear-gradient(135deg, #0d1b6e 0%, #1a2980 100%)',
              color: '#fff',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/companylogo.png" alt="A2 Insurance" style={{ height: 40, width: 'auto', display: 'block', objectFit: 'contain' }} />
          </Box>

          {/* Form */}
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

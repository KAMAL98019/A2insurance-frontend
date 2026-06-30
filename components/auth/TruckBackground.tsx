'use client';

import { Box } from '@mui/material';

export default function TruckBackground() {
  return (
    <Box
      component="img"
      src="/truck-bg.jpg"
      alt=""
      aria-hidden="true"
      sx={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.18,
        pointerEvents: 'none',
      }}
      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

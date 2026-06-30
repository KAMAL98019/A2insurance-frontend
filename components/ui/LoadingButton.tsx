'use client';

import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export default function LoadingButton({ loading, children, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      endIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
      {...props}
    >
      {children}
    </Button>
  );
}

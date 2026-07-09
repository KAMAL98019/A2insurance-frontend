'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import apiClient from '../../../lib/api/axios';
import RegisterForm from '../../../components/auth/RegisterForm';
import type { ApiResponse } from '../../../types/auth.types';

export default function RegisterPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    document.title = 'Create Account | A2 Insurance';
  }, []);

  useEffect(() => {
    apiClient.get<ApiResponse<boolean>>('/auth/master-exists')
      .then(({ data }) => {
        if (data.data) {
          router.replace('/login?notice=setup_complete');
        } else {
          setAllowed(true);
        }
      })
      .catch(() => setAllowed(true)) // fail open to the form; backend will reject if master already exists
      .finally(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return allowed ? <RegisterForm /> : null;
}

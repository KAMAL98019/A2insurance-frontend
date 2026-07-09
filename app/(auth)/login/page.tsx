import { Metadata } from 'next';
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import LoginForm from '../../../components/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign In | A2 Insurance' };

export default function LoginPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
      <LoginForm />
    </Suspense>
  );
}

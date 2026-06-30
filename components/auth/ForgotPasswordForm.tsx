'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Typography, Alert, Link as MuiLink } from '@mui/material';
import { MarkEmailRead } from '@mui/icons-material';
import NextLink from 'next/link';
import { forgotPasswordSchema, ForgotPasswordFormValues } from '../../lib/validations/forgot-password.schema';
import { useAuth } from '../../hooks/useAuth';
import LoadingButton from '../ui/LoadingButton';
import { AxiosError } from 'axios';
import { ApiError } from '../../types/auth.types';

export default function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError('');
    setLoading(true);
    try {
      const result = await forgotPassword(values);
      setSuccess(result.message);
    } catch (err) {
      const error = err as AxiosError<{ data: ApiError }>;
      const msg = error.response?.data?.data?.message;
      setServerError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <MarkEmailRead sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Request Received
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          {success}
        </Typography>
        <MuiLink component={NextLink} href="/login" underline="hover" sx={{ fontWeight: 600 }}>
          Back to Sign In
        </MuiLink>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Forgot password?
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: { xs: 2, sm: 3 } }}>
        Enter your email and an administrator will assist you with resetting your password.
      </Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{serverError}</Alert>}

      <TextField
        fullWidth size="small"
        label="Email address"
        type="email"
        autoFocus
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        sx={{ mb: { xs: 2, sm: 3 } }}
        {...register('email')}
      />

      <LoadingButton type="submit" variant="contained" fullWidth size="large" loading={loading}>
        Submit Request
      </LoadingButton>

      <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
        <MuiLink component={NextLink} href="/login" underline="hover" sx={{ fontWeight: 600 }}>
          ← Back to Sign In
        </MuiLink>
      </Typography>
    </Box>
  );
}

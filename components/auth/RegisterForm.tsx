'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { registerSchema, RegisterFormValues } from '../../lib/validations/register.schema';
import { useAuth } from '../../hooks/useAuth';
import LoadingButton from '../ui/LoadingButton';
import { AxiosError } from 'axios';
import { ApiError } from '../../types/auth.types';

export default function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError('');
    setLoading(true);
    try {
      const result = await registerUser(values);
      setSuccess(result.message + ' Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      const error = err as AxiosError<{ data: ApiError }>;
      const msg = error.response?.data?.data?.message;
      setServerError(Array.isArray(msg) ? msg[0] : (msg ?? 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Create account
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: { xs: 2, sm: 3 } }}>
        Fill in your details to create your A2 Insurance account.
      </Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{serverError}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      <TextField
        fullWidth size="small"
        label="Full name"
        autoComplete="name"
        autoFocus
        error={!!errors.name}
        helperText={errors.name?.message}
        sx={{ mb: 2 }}
        {...register('name')}
      />

      <TextField
        fullWidth size="small"
        label="Email address"
        type="email"
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        sx={{ mb: 2 }}
        {...register('email')}
      />

      <TextField
        fullWidth size="small"
        label="Phone number"
        type="tel"
        autoComplete="tel"
        placeholder="+1 555 000 0000"
        error={!!errors.phoneNumber}
        helperText={errors.phoneNumber?.message}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ mb: 2 }}
        {...register('phoneNumber')}
      />

      <TextField
        fullWidth size="small"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        error={!!errors.password}
        helperText={errors.password?.message}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
        {...register('password')}
      />

      <LoadingButton type="submit" variant="contained" fullWidth size="large" loading={loading}>
        Create Account
      </LoadingButton>

      <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
        Already have an account?{' '}
        <MuiLink component={NextLink} href="/login" underline="hover" sx={{ fontWeight: 600 }}>
          Sign in
        </MuiLink>
      </Typography>
    </Box>
  );
}

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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSearchParams } from 'next/navigation';
import { loginSchema, LoginFormValues } from '../../lib/validations/login.schema';
import { useAuth } from '../../hooks/useAuth';
import LoadingButton from '../ui/LoadingButton';
import { AxiosError } from 'axios';
import { ApiError } from '../../types/auth.types';

export default function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const notice = searchParams.get('notice');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('');
    setLoading(true);
    try {
      await login(values);
    } catch (err) {
      const error = err as AxiosError<{ data: ApiError }>;
      const msg = error.response?.data?.data?.message;
      setServerError(Array.isArray(msg) ? msg[0] : (msg ?? 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Welcome back
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: { xs: 2, sm: 3 } }}>
        Please enter your credentials to access your dashboard.
      </Typography>

      {notice === 'setup_complete' && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Setup is already complete. Please sign in.
        </Alert>
      )}

      {serverError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {serverError}
        </Alert>
      )}

      <TextField
        fullWidth size="small"
        label="Email address"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="admin@a2insurance.com"
        error={!!errors.email}
        helperText={errors.email?.message}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ mb: 2 }}
        {...register('email')}
      />

      <TextField
        fullWidth size="small"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
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
        sx={{ mb: 1 }}
        {...register('password')}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
        <FormControlLabel
          control={<Checkbox size="small" />}
          label={<Typography variant="body2">Remember me</Typography>}
        />
      </Box>

      <LoadingButton type="submit" variant="contained" fullWidth size="large" loading={loading}>
        Sign In
      </LoadingButton>
    </Box>
  );
}

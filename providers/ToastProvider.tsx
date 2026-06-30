'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';

interface ToastContextValue {
  showToast:   (message: string, severity?: AlertColor) => void;
  showError:   (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo:    (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast:   () => {},
  showError:   () => {},
  showSuccess: () => {},
  showInfo:    () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open,     setOpen]     = useState(false);
  const [message,  setMessage]  = useState('');
  const [severity, setSeverity] = useState<AlertColor>('error');
  const [key,      setKey]      = useState(0);

  const showToast = useCallback((msg: string, sev: AlertColor = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setKey((k) => k + 1);
    setOpen(true);
  }, []);

  const showError   = useCallback((msg: string) => showToast(msg, 'error'),   [showToast]);
  const showSuccess = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const showInfo    = useCallback((msg: string) => showToast(msg, 'info'),    [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showInfo }}>
      {children}
      <Snackbar
        key={key}
        open={open}
        autoHideDuration={5000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={severity}
          variant="filled"
          sx={{ minWidth: 320, boxShadow: 4 }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

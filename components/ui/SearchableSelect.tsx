'use client';

import { Autocomplete, TextField } from '@mui/material';

export interface SearchableOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: SearchableOption[];
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

// A drop-in, searchable replacement for `<TextField select>` — every option
// list in the insurance forms is filterable by typing instead of scrolling.
export default function SearchableSelect({
  label, value, onChange, options, error, helperText, disabled, placeholder,
}: Props) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      options={options}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      value={selected}
      onChange={(_, next) => onChange(next?.value ?? '')}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps?.htmlInput, autoComplete: 'off' },
          }}
        />
      )}
    />
  );
}

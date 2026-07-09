'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Select, MenuItem, Box, Typography, Chip } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import { useAllLocations } from '../../hooks/useAllLocations';
import { useLocationFilterStore } from '../../store/location-filter.store';

export default function LocationSwitcher() {
  const { locations: raw } = useAllLocations();
  const { selectedLocationId, setSelectedLocationId } = useLocationFilterStore();
  const hasAutoCorrected = useRef(false);

  // Active branches first, inactive ones after — still selectable (for
  // reviewing a closed branch's historical data), just visually separated.
  const locations = useMemo(
    () => [...raw].sort((a, b) => (a.status === b.status ? 0 : a.status === 'ACTIVE' ? -1 : 1)),
    [raw],
  );

  // On load, land on an active branch by default — never get stuck showing
  // a stale/inactive selection carried over from a previous session. This
  // only runs once; after that, deliberately picking an inactive branch
  // from the dropdown (to review its data) sticks instead of snapping back.
  useEffect(() => {
    if (locations.length === 0 || hasAutoCorrected.current) return;
    const current = locations.find((l) => l.id === selectedLocationId);
    if (!current || current.status !== 'ACTIVE') {
      const firstActive = locations.find((l) => l.status === 'ACTIVE');
      setSelectedLocationId((firstActive ?? locations[0]).id);
    }
    hasAutoCorrected.current = true;
  }, [locations, selectedLocationId, setSelectedLocationId]);

  // Nothing to switch between — hide entirely (e.g. single-location Admin Users)
  if (locations.length < 2) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
      <Select
        size="small"
        value={selectedLocationId ?? ''}
        onChange={(e) => setSelectedLocationId(Number(e.target.value))}
        startAdornment={<PlaceIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />}
        sx={{
          minWidth: 160,
          '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.75, fontSize: '0.8125rem', fontWeight: 600 },
        }}
      >
        {locations.map((l) => (
          <MenuItem key={l.id} value={l.id} sx={{ opacity: l.status === 'INACTIVE' ? 0.6 : 1 }}>
            <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>{l.name}</Typography>
            {l.status === 'INACTIVE' && (
              <Chip label="Inactive" size="small" variant="outlined" sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} />
            )}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

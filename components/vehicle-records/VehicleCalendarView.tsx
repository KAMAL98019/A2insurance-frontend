'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, IconButton, Chip, Button, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, useTheme, useMediaQuery,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NextLink from 'next/link';
import dayjs, { Dayjs } from 'dayjs';
import type { VehicleRecord } from '../../types/vehicle-record.types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildGrid(year: number, month: number): (Dayjs | null)[][] {
  const first = dayjs(new Date(year, month, 1));
  const cells: (Dayjs | null)[] = [];
  for (let i = 0; i < first.day(); i++) cells.push(null);
  for (let d = 1; d <= first.daysInMonth(); d++) cells.push(dayjs(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Dayjs | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function chipColor(dateStr: string, now: Dayjs): 'error' | 'warning' | 'info' | 'success' {
  const diff = dayjs(dateStr).diff(now, 'day');
  if (diff < 0) return 'error';
  if (diff <= 7) return 'warning';
  if (diff <= 30) return 'info';
  return 'success';
}

interface Props { records: VehicleRecord[] }

export default function VehicleCalendarView({ records }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // All date state starts null on server — set after client mount to avoid hydration mismatch
  const [now, setNow] = useState<Dayjs | null>(null);
  const [month, setMonth] = useState<Dayjs | null>(null);
  const [selected, setSelected] = useState<Dayjs | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickYear, setPickYear] = useState<number>(0);

  useEffect(() => {
    const today = dayjs();
    setNow(today);
    setMonth(today);
    setPickYear(today.year());
  }, []);

  // Render a skeleton until client has mounted (keeps SSR output stable)
  if (!now || !month) {
    return (
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Skeleton variant="rectangular" height={480} />
      </Paper>
    );
  }

  const weeks = buildGrid(month.year(), month.month());
  const maxVisible = isMobile ? 1 : 2;

  const byDate = records.reduce<Record<string, VehicleRecord[]>>((acc, r) => {
    const k = dayjs(r.policyExpiryDate).format('YYYY-MM-DD');
    (acc[k] ??= []).push(r);
    return acc;
  }, {});

  const selKey = selected?.format('YYYY-MM-DD') ?? '';
  const selRecords = selKey ? (byDate[selKey] ?? []) : [];

  return (
    <>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 2 }, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <IconButton size="small" onClick={() => setMonth((m) => m!.subtract(1, 'month'))} disabled={picking}>
            <ChevronLeftIcon />
          </IconButton>

          {/* Clickable month/year → opens picker */}
          <Box
            onClick={() => { setPicking((p) => !p); setPickYear(month.year()); }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', px: 1.5, py: 0.5, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}
          >
            <TodayIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700, userSelect: 'none' }}>{month.format('MMMM YYYY')}</Typography>
            <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary', transition: 'transform 0.2s', transform: picking ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button size="small" variant="outlined" onClick={() => { setMonth(dayjs()); setPicking(false); }}>Today</Button>
            <IconButton size="small" onClick={() => setMonth((m) => m!.add(1, 'month'))} disabled={picking}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Month / Year picker panel */}
        {picking && (
          <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', p: 2 }}>
            {/* Year row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1.5 }}>
              <IconButton size="small" onClick={() => setPickYear((y) => y - 1)}><ChevronLeftIcon /></IconButton>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, minWidth: 48, textAlign: 'center' }}>{pickYear}</Typography>
              <IconButton size="small" onClick={() => setPickYear((y) => y + 1)}><ChevronRightIcon /></IconButton>
            </Box>
            {/* 4×3 month grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
              {MONTHS.map((name, idx) => {
                const isActive = month.year() === pickYear && month.month() === idx;
                const isNow = now.year() === pickYear && now.month() === idx;
                return (
                  <Box
                    key={name}
                    onClick={() => { setMonth(dayjs(new Date(pickYear, idx, 1))); setPicking(false); }}
                    sx={{
                      py: 0.9, borderRadius: 1.5, textAlign: 'center', cursor: 'pointer',
                      bgcolor: isActive ? 'primary.main' : isNow ? 'primary.50' : 'transparent',
                      color: isActive ? '#fff' : isNow ? 'primary.main' : 'text.primary',
                      fontWeight: isActive || isNow ? 700 : 400,
                      border: isNow && !isActive ? '1px solid' : '1px solid transparent',
                      borderColor: isNow && !isActive ? 'primary.main' : 'transparent',
                      '&:hover': { bgcolor: isActive ? 'primary.dark' : 'action.hover' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'inherit', color: 'inherit', fontSize: '0.82rem' }}>{name}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 1, px: 2, py: 1, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          {[
            { color: 'error' as const, label: 'Expired' },
            { color: 'warning' as const, label: 'Expiring ≤ 7 days' },
            { color: 'info' as const, label: 'Expiring ≤ 30 days' },
            { color: 'success' as const, label: 'Active' },
          ].map(({ color, label }) => (
            <Chip key={color} label={label} size="small" color={color} variant="outlined" sx={{ fontSize: '0.7rem' }} />
          ))}
        </Box>

        {/* Day-of-week headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
          {DOW.map((d) => (
            <Box key={d} sx={{ py: 0.75, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                {isMobile ? d[0] : d}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <Box
            key={wi}
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < weeks.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
          >
            {week.map((day, di) => {
              if (!day) {
                return (
                  <Box
                    key={di}
                    sx={{ minHeight: { xs: 60, sm: 90 }, bgcolor: 'grey.50', borderRight: di < 6 ? '1px solid' : 'none', borderColor: 'divider' }}
                  />
                );
              }
              const key = day.format('YYYY-MM-DD');
              const dayRecs = byDate[key] ?? [];
              const isToday = day.isSame(now, 'day');
              const isSelected = selected && day.isSame(selected, 'day');

              return (
                <Box
                  key={di}
                  onClick={() => dayRecs.length > 0 && setSelected(day)}
                  sx={{
                    minHeight: { xs: 60, sm: 90 },
                    p: { xs: 0.25, sm: 0.5 },
                    borderRight: di < 6 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    cursor: dayRecs.length > 0 ? 'pointer' : 'default',
                    bgcolor: isSelected ? 'primary.50' : isToday ? 'warning.50' : 'background.paper',
                    '&:hover': dayRecs.length > 0 ? { bgcolor: isSelected ? 'primary.100' : 'action.hover' } : undefined,
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Day number */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.25 }}>
                    <Box sx={{
                      width: { xs: 18, sm: 22 }, height: { xs: 18, sm: 22 }, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: isToday ? 'primary.main' : 'transparent',
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : 'text.primary', fontSize: { xs: '0.62rem', sm: '0.72rem' } }}>
                        {day.date()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Events */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {dayRecs.slice(0, maxVisible).map((r) => (
                      <Chip
                        key={r.id}
                        label={r.vehicleNumber}
                        size="small"
                        color={chipColor(r.policyExpiryDate, now)}
                        sx={{ height: { xs: 15, sm: 17 }, fontSize: { xs: '0.55rem', sm: '0.6rem' }, '& .MuiChip-label': { px: 0.5 } }}
                      />
                    ))}
                    {dayRecs.length > maxVisible && (
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.58rem', sm: '0.62rem' }, color: 'text.secondary', pl: 0.25 }}>
                        +{dayRecs.length - maxVisible} more
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
      </Paper>

      {/* Day detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Records expiring on {selected?.format('DD MMMM YYYY')}
          <Typography variant="body2" color="text.secondary">{selRecords.length} record(s)</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selRecords.map((r) => (
            <Paper key={r.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.vehicleNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.ownerName} · {r.cellNumber}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip label={r.category} size="small" />
                  <Chip
                    label={chipColor(r.policyExpiryDate, now) === 'error' ? 'Expired' : 'Expiring'}
                    size="small"
                    color={chipColor(r.policyExpiryDate, now)}
                  />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {r.insuranceCompany}
              </Typography>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button component={NextLink} href={`/vehicle-records?from=${selKey}&to=${selKey}`} size="small">View All</Button>
          <Button onClick={() => setSelected(null)} variant="contained" disableElevation>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

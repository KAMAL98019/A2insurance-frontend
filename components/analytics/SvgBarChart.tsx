'use client';

import { Box, Typography } from '@mui/material';

export interface BarDatum {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: BarDatum[];
  height?: number;
  showValues?: boolean;
  unit?: string;
}

export function SvgBarChart({ data, height = 160, showValues = true, unit = '' }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW   = 44;
  const gap    = 18;
  const paddingTop = 28;
  const paddingBot = 36;
  const chartH = height - paddingTop - paddingBot;
  const totalW = data.length * (barW + gap) - gap + 32;

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        width={Math.max(totalW, 260)}
        height={height}
        style={{ display: 'block', margin: '0 auto' }}
        aria-label="Bar chart"
      >
        {/* horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = paddingTop + chartH * (1 - f);
          return (
            <g key={f}>
              <line x1={0} y1={y} x2={totalW} y2={y}
                stroke="#e0e0e0" strokeWidth={1} strokeDasharray={f === 0 ? '0' : '4 3'} />
              {f > 0 && (
                <text x={0} y={y - 3} fontSize={9} fill="#bdbdbd" textAnchor="start">
                  {Math.round(max * f)}{unit}
                </text>
              )}
            </g>
          );
        })}

        {/* bars */}
        {data.map((d, i) => {
          const x = 16 + i * (barW + gap);
          const barH = chartH * (d.value / max);
          const y = paddingTop + chartH - barH;
          const rx = 5;

          return (
            <g key={i}>
              {/* shadow/base */}
              <rect x={x + 2} y={y + 3} width={barW} height={barH}
                rx={rx} fill="rgba(0,0,0,0.07)" />
              {/* bar */}
              <rect x={x} y={y} width={barW} height={Math.max(barH, rx * 2)}
                rx={rx} fill={d.color}
                style={{ transition: 'height 0.4s ease, y 0.4s ease' }}
              />
              {/* value label */}
              {showValues && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle"
                  fontSize={11} fontWeight="700" fill={d.color}>
                  {d.value}{unit}
                </text>
              )}
              {/* x-axis label */}
              <text x={x + barW / 2} y={height - 6} textAnchor="middle"
                fontSize={10} fill="#616161">
                {d.label.length > 8 ? d.label.slice(0, 8) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}

// ─── Grouped bar comparison chart ────────────────────────────────────────────

export interface GroupDatum {
  label: string;
  values: { name: string; value: number; color: string }[];
}

interface GroupProps {
  data: GroupDatum[];
  height?: number;
}

export function SvgGroupedBarChart({ data, height = 180 }: GroupProps) {
  const allValues = data.flatMap((d) => d.values.map((v) => v.value));
  const max = Math.max(...allValues, 1);
  const groupCount = data.length;
  const seriesCount = data[0]?.values.length ?? 1;
  const barW = 20;
  const barGap = 3;
  const groupGap = 24;
  const paddingTop = 28;
  const paddingBot = 40;
  const chartH = height - paddingTop - paddingBot;
  const groupW = seriesCount * barW + (seriesCount - 1) * barGap;
  const totalW = groupCount * (groupW + groupGap) + 24;

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg width={Math.max(totalW, 260)} height={height} style={{ display: 'block', margin: '0 auto' }}>
        {/* grid lines */}
        {[0, 0.5, 1].map((f) => {
          const y = paddingTop + chartH * (1 - f);
          return (
            <line key={f} x1={0} y1={y} x2={totalW} y2={y}
              stroke="#e0e0e0" strokeWidth={1} strokeDasharray={f === 0 ? '0' : '4 3'} />
          );
        })}

        {/* bars */}
        {data.map((group, gi) => {
          const groupX = 12 + gi * (groupW + groupGap);
          return (
            <g key={gi}>
              {group.values.map((v, vi) => {
                const x = groupX + vi * (barW + barGap);
                const barH = chartH * (v.value / max);
                const y = paddingTop + chartH - barH;
                return (
                  <g key={vi}>
                    <rect x={x} y={y} width={barW} height={Math.max(barH, 4)}
                      rx={3} fill={v.color} />
                    {v.value > 0 && (
                      <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fontWeight="700" fill={v.color}>
                        {v.value}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={groupX + groupW / 2} y={height - 6} textAnchor="middle"
                fontSize={10} fill="#616161">
                {group.label.length > 10 ? group.label.slice(0, 10) + '…' : group.label}
              </text>
            </g>
          );
        })}

        {/* legend */}
        {data[0]?.values.map((v, vi) => (
          <g key={vi} transform={`translate(${12 + vi * 90}, ${height - paddingBot + 24})`}>
            <rect width={10} height={10} rx={2} fill={v.color} />
            <text x={14} y={9} fontSize={10} fill="#616161">{v.name}</text>
          </g>
        ))}
      </svg>
    </Box>
  );
}

// ─── Simple donut chart (SVG) ─────────────────────────────────────────────────

interface DonutProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function SvgDonut({ data, size = 130 }: DonutProps) {
  const total  = data.reduce((s, d) => s + d.value, 0);
  const r      = size / 2 - 12;
  const cx     = size / 2;
  const cy     = size / 2;
  const stroke = r * 0.5;

  let offset = 0;
  const circ = 2 * Math.PI * r;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e0e0e0" strokeWidth={stroke} />
        ) : (
          data.filter((d) => d.value > 0).map((d, i) => {
            const pct = d.value / total;
            const dashLen = circ * pct;
            const dashGap = circ - dashLen;
            const el = (
              <circle key={i}
                cx={cx} cy={cy} r={r} fill="none"
                stroke={d.color} strokeWidth={stroke}
                strokeDasharray={`${dashLen} ${dashGap}`}
                strokeDashoffset={-offset * circ}
                style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.4s ease' }}
              />
            );
            offset += pct;
            return el;
          })
        )}
        {/* center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight="800" fill="#212121">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#9e9e9e">TOTAL</text>
      </svg>

      {/* legend */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 100 }}>
        {data.map((d) => (
          <Box key={d.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
              {d.label}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: d.color, ml: 'auto' }}>
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

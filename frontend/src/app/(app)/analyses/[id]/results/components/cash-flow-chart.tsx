'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { BUCKET_COLORS, cents, type VulnerabilityBucket } from '../types';

interface CashFlowChartProps {
  prePurchaseFreeCashCents: number;
  projectedFreeCashCents: number;
  bucket: VulnerabilityBucket;
  productName: string;
}

export default function CashFlowChart({
  prePurchaseFreeCashCents,
  projectedFreeCashCents,
  bucket,
  productName,
}: CashFlowChartProps) {
  const afterColor = BUCKET_COLORS[bucket];

  const data = [
    { name: 'Before', value: prePurchaseFreeCashCents / 100 },
    { name: `After ${productName}`, value: projectedFreeCashCents / 100 },
  ];

  const colors = ['#2e7d32', afterColor];

  const formatLabel = (val: unknown) => cents(Number(val) * 100);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Cash Flow Impact
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 30, right: 20, bottom: 5, left: 20 }}
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 13, fill: '#64748B' }}
          />
          <YAxis hide />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={formatLabel}
              style={{ fontWeight: 600, fontSize: 14, fill: '#1E293B' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  cents,
  type VulnerabilityBucket,
} from '../types';

interface ScoreHeaderProps {
  score: number;
  bucket: VulnerabilityBucket;
  projectedFreeCashCents: number;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

export default function ScoreHeader({
  score,
  bucket,
  projectedFreeCashCents,
}: ScoreHeaderProps) {
  const displayScore = useCountUp(score);
  const color = BUCKET_COLORS[bucket];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        py: 3,
      }}
    >
      {/* Animated circular progress ring */}
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {/* Track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={140}
          thickness={4}
          sx={{ color: 'grey.200', position: 'absolute' }}
        />
        {/* Filled arc */}
        <CircularProgress
          variant="determinate"
          value={displayScore}
          size={140}
          thickness={4}
          sx={{
            color,
            transition: 'none',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h2"
            fontWeight={700}
            sx={{ color, lineHeight: 1 }}
          >
            {displayScore}
          </Typography>
        </Box>
      </Box>

      <Chip
        label={BUCKET_LABELS[bucket]}
        sx={{
          bgcolor: color,
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      />

      <Typography
        variant="body1"
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 360 }}
      >
        After this purchase you would have{' '}
        <strong>{cents(projectedFreeCashCents)}/month</strong> left
      </Typography>
    </Box>
  );
}

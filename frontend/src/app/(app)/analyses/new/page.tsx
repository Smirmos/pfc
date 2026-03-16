'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeIcon from '@mui/icons-material/Home';
import DevicesIcon from '@mui/icons-material/Devices';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import BoltIcon from '@mui/icons-material/Bolt';
import api from '@/lib/axios';

interface ImpulseData {
  productName?: string;
  priceDollars?: number;
}

const CATEGORIES = [
  {
    id: 'vehicle',
    label: 'Vehicle',
    description: 'Car, motorcycle, or other vehicle purchase',
    icon: DirectionsCarIcon,
    color: '#1F4E79',
  },
  {
    id: 'home',
    label: 'Home / Rent',
    description: 'Rental, lease, or housing costs',
    icon: HomeIcon,
    color: '#2E7D32',
  },
  {
    id: 'appliance',
    label: 'Appliance / Tech',
    description: 'Electronics, appliances, or tech purchases',
    icon: DevicesIcon,
    color: '#7B1FA2',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Any other planned purchase or expense',
    icon: MoreHorizIcon,
    color: '#E65100',
  },
] as const;

export default function NewAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromImpulse = searchParams.get('from_impulse');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [impulseData, setImpulseData] = useState<ImpulseData | null>(null);

  useEffect(() => {
    if (!fromImpulse) return;
    api
      .get(`/impulse-checks/${fromImpulse}`)
      .then(({ data }) => {
        setImpulseData({
          productName: data.productName ?? data.name,
          priceDollars: data.priceDollars ?? data.price,
        });
      })
      .catch(() => {
        // Impulse module not yet available — proceed without pre-fill
      });
  }, [fromImpulse]);

  const handleSelect = async (categoryId: string) => {
    setLoading(categoryId);
    setError('');
    try {
      const label =
        CATEGORIES.find((c) => c.id === categoryId)?.label ?? 'Untitled';
      const analysisName = impulseData?.productName
        ? `${impulseData.productName} Analysis`
        : `New ${label} Analysis`;
      const { data } = await api.post('/analyses', {
        name: analysisName,
        category: categoryId,
      });

      // Pre-save impulse price as initial inputs
      if (impulseData?.priceDollars) {
        await api
          .put(`/analyses/${data.id}/inputs`, {
            cash_price_cents: Math.round(impulseData.priceDollars * 100),
          })
          .catch(() => {});
      }

      const params = fromImpulse ? `?from_impulse=${fromImpulse}` : '';
      router.push(`/analyses/${data.id}/inputs${params}`);
    } catch {
      setError('Failed to create analysis. Please try again.');
      setLoading(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        New Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Choose a category to get started with your purchase analysis
      </Typography>

      {fromImpulse && (
        <Alert
          severity="info"
          icon={<BoltIcon />}
          sx={{
            mb: 3,
            bgcolor: 'rgba(245, 158, 11, 0.08)',
            color: 'warning.dark',
            '& .MuiAlert-icon': { color: 'warning.main' },
          }}
        >
          Upgraded from Impulse Check &mdash; pre-filled from your screenshot
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 3,
          maxWidth: 640,
        }}
      >
        {CATEGORIES.map(({ id, label, description, icon: Icon, color }) => (
          <Card
            key={id}
            sx={{
              opacity: loading && loading !== id ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            <CardActionArea
              onClick={() => handleSelect(id)}
              disabled={loading !== null}
              sx={{ p: 1 }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${color}14`,
                    mb: 2,
                  }}
                >
                  <Icon sx={{ fontSize: 28, color }} />
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
                {loading === id && (
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Creating...
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

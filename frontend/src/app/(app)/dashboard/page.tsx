'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import BoltIcon from '@mui/icons-material/Bolt';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const displayName = user?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Hey, {displayName}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        What would you like to do today?
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow:
                  '0 4px 12px rgba(31, 78, 121, 0.15)',
              },
            }}
            onClick={() => router.push('/analysis')}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <AnalyticsIcon
                sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
              />
              <Typography variant="h6" sx={{ mb: 1 }}>
                New Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Deep-dive into a planned purchase with full financial context
              </Typography>
              <Button variant="contained">Start Analysis</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow:
                  '0 4px 12px rgba(245, 158, 11, 0.25)',
              },
            }}
            onClick={() => router.push('/impulse')}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <BoltIcon
                sx={{ fontSize: 48, color: 'warning.main', mb: 2 }}
              />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Impulse Check
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Quick sanity check before you hit &ldquo;Buy Now&rdquo;
              </Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'warning.main',
                  color: '#1E293B',
                  '&:hover': { bgcolor: 'warning.dark', color: '#fff' },
                }}
              >
                Quick Check
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

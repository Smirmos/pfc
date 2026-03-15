'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BoltIcon from '@mui/icons-material/Bolt';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useAuth } from '@/context/auth-context';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const handleAnalysis = () => {
    router.push(isAuthenticated ? '/analysis' : '/login');
  };

  const handleImpulse = () => {
    router.push(isAuthenticated ? '/impulse' : '/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={700} color="primary.main">
          PFC Advisor
        </Typography>
        {!isLoading && !isAuthenticated && (
          <Stack direction="row" spacing={1}>
            <Button variant="text" onClick={() => router.push('/login')}>
              Log in
            </Button>
            <Button variant="contained" onClick={() => router.push('/register')}>
              Sign up
            </Button>
          </Stack>
        )}
        {!isLoading && isAuthenticated && (
          <Button variant="outlined" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        )}
      </Box>

      {/* Hero */}
      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography
          variant="h2"
          fontWeight={700}
          sx={{ mb: 2, color: 'text.primary' }}
        >
          Think twice.
          <br />
          <Box component="span" sx={{ color: 'primary.main' }}>
            Spend once.
          </Box>
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight={400}
          sx={{ mb: 6, maxWidth: 520 }}
        >
          AI-powered financial analysis that helps you make confident purchase
          decisions — from big investments to everyday impulse buys.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ width: '100%', maxWidth: 480 }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<AnalyticsIcon />}
            onClick={handleAnalysis}
            sx={{
              flex: 1,
              py: 2,
              fontSize: '1rem',
            }}
          >
            Analyse a big purchase
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={<BoltIcon />}
            onClick={handleImpulse}
            sx={{
              flex: 1,
              py: 2,
              fontSize: '1rem',
              bgcolor: 'warning.main',
              color: '#1E293B',
              '&:hover': { bgcolor: 'warning.dark', color: '#FFFFFF' },
            }}
          >
            Quick Impulse Check
          </Button>
        </Stack>
      </Container>

      {/* Footer */}
      <Box component="footer" sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Private Finance Advisor &copy; {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}

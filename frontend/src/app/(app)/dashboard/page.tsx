'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '@/lib/axios';
import { useAuth } from '@/context/auth-context';
import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  CATEGORY_ICONS,
  cents,
  type AnalysisSummary,
  type DashboardData,
  type ProfileSummary,
  type VulnerabilityBucket,
} from './types';

// ── Helpers ────────────────────────────────────────────────────────────

function getEmergencyColor(months: number): string {
  if (months < 3) return '#c62828';
  if (months < 6) return '#f59e0b';
  if (months < 9) return '#2e7d32';
  return '#1b5e20';
}

function getEmergencyLabel(months: number): string {
  if (months < 3) return 'Critical';
  if (months < 6) return 'Low';
  if (months < 9) return 'Adequate';
  return 'Strong';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ── Mini Score Ring ────────────────────────────────────────────────────

function MiniScoreRing({
  score,
  bucket,
}: {
  score: number;
  bucket: VulnerabilityBucket;
}) {
  const color = BUCKET_COLORS[bucket];
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={40}
        thickness={4}
        sx={{ color: 'grey.200', position: 'absolute' }}
      />
      <CircularProgress
        variant="determinate"
        value={score}
        size={40}
        thickness={4}
        sx={{ color }}
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
        <Typography variant="caption" fontWeight={700} sx={{ color, fontSize: 11 }}>
          {score}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Health Cards ───────────────────────────────────────────────────────

function FreeCashCard({ profile }: { profile: ProfileSummary }) {
  const color = BUCKET_COLORS[profile.vulnerabilityBucket];
  const savingsGapStatus =
    profile.savingsGapCents <= 0 ? 'on_track' : 'shortfall';

  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          Free Cash Health
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
          {cents(profile.currentFreeCashCents)}
        </Typography>
        <Chip
          label={BUCKET_LABELS[profile.vulnerabilityBucket]}
          size="small"
          sx={{
            bgcolor: color,
            color: '#fff',
            fontWeight: 600,
            mt: 1,
            mb: 1,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          available each month after all fixed costs
        </Typography>
        <Box sx={{ mt: 1.5 }}>
          {savingsGapStatus === 'on_track' ? (
            <Typography variant="caption" sx={{ color: '#2e7d32' }}>
              Savings goal: on track
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: '#f59e0b' }}>
              Savings goal: {cents(profile.savingsGapCents)} shortfall
            </Typography>
          )}
          <Typography
            variant="caption"
            display="block"
            color="text.secondary"
            sx={{ mt: 0.25 }}
          >
            (your savings target does not affect your free cash)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function EmergencyFundCard({ profile }: { profile: ProfileSummary }) {
  const months = profile.emergencyMonths;
  const color = getEmergencyColor(months);
  const progress = Math.min(months / 9, 1) * 100;

  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          Emergency Fund
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
          {months.toFixed(1)}{' '}
          <Typography component="span" variant="h6" color="text.secondary">
            months
          </Typography>
        </Typography>
        <Chip
          label={getEmergencyLabel(months)}
          size="small"
          sx={{ bgcolor: color, color: '#fff', fontWeight: 600, mt: 1, mb: 1.5 }}
        />
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              borderRadius: 4,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Target: 6+ months recommended
        </Typography>
      </CardContent>
    </Card>
  );
}

function ActiveBurdensCard({ burdens }: { burdens: AnalysisSummary[] }) {
  const totalBurden = burdens.reduce(
    (sum, b) => sum + (b.monthly_burden_cents ?? 0),
    0,
  );
  const shown = burdens.slice(0, 3);
  const extra = burdens.length - 3;

  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          Active Burdens
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
          {burdens.length}
        </Typography>
        {totalBurden > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {cents(totalBurden)}/mo total
          </Typography>
        )}
        {shown.map((b) => (
          <Box
            key={b.id}
            sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}
          >
            <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
              {b.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {b.monthly_burden_cents != null
                ? cents(b.monthly_burden_cents) + '/mo'
                : '—'}
            </Typography>
          </Box>
        ))}
        {extra > 0 && (
          <Typography variant="caption" color="text.secondary">
            + {extra} more
          </Typography>
        )}
        {burdens.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No active burdens
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent Analyses ────────────────────────────────────────────────────

function RecentAnalyses({
  analyses,
}: {
  analyses: AnalysisSummary[];
}) {
  const router = useRouter();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Recent Analyses
        </Typography>
        <Link
          component="button"
          variant="body2"
          underline="hover"
          onClick={() => router.push('/analysis/history')}
        >
          View all
        </Link>
      </Box>

      {analyses.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              No analyses yet. Start by analysing a purchase.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {analyses.map((a) => (
            <Grid item xs={12} sm={4} key={a.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontSize: 20 }}>
                        {CATEGORY_ICONS[a.category] ?? '\u{1F4E6}'}
                      </Typography>
                      <Typography variant="subtitle2" noWrap>
                        {a.name}
                      </Typography>
                    </Box>
                    {a.score != null && a.projected_vulnerability_bucket ? (
                      <MiniScoreRing
                        score={a.score}
                        bucket={a.projected_vulnerability_bucket}
                      />
                    ) : (
                      <Typography variant="h6" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(a.created_at)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    {a.score != null && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          router.push(`/analyses/${a.id}/results`)
                        }
                      >
                        View Results
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                      onClick={() =>
                        router.push(`/analyses/${a.id}/inputs`)
                      }
                    >
                      Re-run
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// ── Recent Impulse Checks ──────────────────────────────────────────────

function RecentImpulseChecks() {
  const router = useRouter();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Recent Impulse Checks
        </Typography>
        <Link
          component="button"
          variant="body2"
          underline="hover"
          onClick={() => router.push('/impulse')}
        >
          View all
        </Link>
      </Box>
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Upload a screenshot of any ad to get an instant verdict.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={220} height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={280} height={24} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={100} height={16} />
                <Skeleton variant="text" width={140} height={40} sx={{ mt: 1 }} />
                <Skeleton variant="rounded" width={90} height={24} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="80%" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12} sm={6}>
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12}>
          <Skeleton variant="text" width={160} height={28} />
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={4} key={i}>
                <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const displayName =
    user?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data as DashboardData;
    },
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        Failed to load dashboard.
      </Alert>
    );
  }

  const dashboard = data!;
  const profile = dashboard.profile_summary;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
        Hey, {displayName}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        What would you like to do today?
      </Typography>

      {/* No profile banner */}
      {!profile && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => router.push('/onboarding')}
            >
              Set up
            </Button>
          }
        >
          Complete your financial profile for accurate results
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Row 1 - Financial Health Cards */}
        {profile && (
          <>
            <Grid item xs={12} md={4}>
              <FreeCashCard profile={profile} />
            </Grid>
            <Grid item xs={12} md={4}>
              <EmergencyFundCard profile={profile} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ActiveBurdensCard burdens={dashboard.active_burdens} />
            </Grid>
          </>
        )}

        {/* Row 2 - CTAs */}
        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(31, 78, 121, 0.15)',
              },
            }}
            onClick={() => router.push('/analyses/new')}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 3,
              }}
            >
              <AddCircleOutlineIcon
                sx={{ fontSize: 36, color: 'primary.main' }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  New Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Deep-dive into a planned purchase
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              background:
                'linear-gradient(135deg, #FEF3C7 0%, #FBBF24 100%)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
              },
            }}
            onClick={() => router.push('/impulse/new')}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 3,
              }}
            >
              <BoltIcon sx={{ fontSize: 36, color: '#92400E' }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1E293B' }}>
                  Impulse Check
                </Typography>
                <Typography variant="body2" sx={{ color: '#78350F' }}>
                  Saw something you want? Get a 30-second verdict.
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#92400E',
                  '&:hover': { bgcolor: '#78350F' },
                  flexShrink: 0,
                }}
              >
                Check It
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 3 - Recent Analyses */}
        <Grid item xs={12}>
          <RecentAnalyses analyses={dashboard.recent_analyses} />
        </Grid>

        {/* Row 4 - Recent Impulse Checks */}
        <Grid item xs={12}>
          <RecentImpulseChecks />
        </Grid>
      </Grid>
    </Box>
  );
}

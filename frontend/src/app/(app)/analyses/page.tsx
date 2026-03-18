'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '@/lib/axios';
import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  CATEGORY_ICONS,
  cents,
  type AnalysisSummary,
  type VulnerabilityBucket,
} from '../dashboard/types';
import {
  CATEGORY_FILTERS,
  SORT_CONFIG,
  STATUS_FILTERS,
  type PaginatedAnalyses,
  type SortOption,
} from './types';

const ROWS_PER_PAGE = 20;

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', opts);
}

// ── Score Ring (32px) ─────────────────────────────────────────────────

function ScoreRing({
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
        size={32}
        thickness={4}
        sx={{ color: 'grey.200', position: 'absolute' }}
      />
      <CircularProgress
        variant="determinate"
        value={score}
        size={32}
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
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color, fontSize: 10 }}
        >
          {score}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Status Chip ────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <Chip
      label={isActive ? 'Active' : 'Inactive'}
      size="small"
      sx={{
        bgcolor: isActive ? 'rgba(46, 125, 50, 0.1)' : 'rgba(0, 0, 0, 0.06)',
        color: isActive ? '#2e7d32' : 'text.secondary',
        fontWeight: 600,
        fontSize: 12,
      }}
    />
  );
}

// ── Quick Stats Bar ────────────────────────────────────────────────────

function QuickStatsBar({
  total,
  highestScore,
  avgScore,
  activeBurdens,
}: {
  total: number;
  highestScore: number | null;
  avgScore: number | null;
  activeBurdens: number;
}) {
  const items = [
    { label: 'Total Analyses', value: String(total) },
    {
      label: 'Highest Score',
      value: highestScore != null ? String(highestScore) : '\u2014',
    },
    {
      label: 'Avg Score',
      value: avgScore != null ? avgScore.toFixed(0) : '\u2014',
    },
    { label: 'Active Burdens', value: String(activeBurdens) },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {items.map((s) => (
        <Grid item xs={6} sm={3} key={s.label}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontSize: 11 }}
              >
                {s.label}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ── Filter Bar ─────────────────────────────────────────────────────────

function FilterBar({
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
}: {
  category: string;
  onCategoryChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  sort: SortOption;
  onSortChange: (val: SortOption) => void;
  search: string;
  onSearchChange: (val: string) => void;
}) {
  return (
    <Box
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}
    >
      <ToggleButtonGroup
        value={category}
        exclusive
        onChange={(_, val) => val && onCategoryChange(val)}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            px: 2,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: '#fff',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          },
        }}
      >
        {CATEGORY_FILTERS.map((c) => (
          <ToggleButton key={c.value} value={c.value}>
            {c.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        size="small"
        sx={{ minWidth: 140 }}
      >
        {STATUS_FILTERS.map((s) => (
          <MenuItem key={s.value} value={s.value}>
            {s.label}
          </MenuItem>
        ))}
      </Select>

      <Select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        size="small"
        sx={{ minWidth: 160 }}
      >
        {Object.entries(SORT_CONFIG).map(([key, { label }]) => (
          <MenuItem key={key} value={key}>
            {label}
          </MenuItem>
        ))}
      </Select>

      <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          placeholder="Search analyses..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
}

// ── Bulk Actions Bar ───────────────────────────────────────────────────

function BulkActionsBar({
  count,
  onDelete,
}: {
  count: number;
  onDelete: () => void;
}) {
  if (count === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 2,
        p: 1.5,
        bgcolor: 'rgba(31, 78, 121, 0.06)',
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        {count} selected
      </Typography>
      <Button
        size="small"
        color="error"
        variant="outlined"
        startIcon={<DeleteIcon />}
        onClick={onDelete}
      >
        Delete
      </Button>
    </Box>
  );
}

// ── Desktop Table ──────────────────────────────────────────────────────

function DesktopTable({
  items,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onMenuOpen,
}: {
  items: AnalysisSummary[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onMenuOpen: (
    event: React.MouseEvent<HTMLElement>,
    analysis: AnalysisSummary,
  ) => void;
}) {
  const allSelected =
    items.length > 0 && items.every((a) => selected.has(a.id));
  const someSelected =
    items.some((a) => selected.has(a.id)) && !allSelected;

  return (
    <TableContainer
      component={Paper}
      sx={{ display: { xs: 'none', md: 'block' } }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleSelectAll}
              />
            </TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="center">Score</TableCell>
            <TableCell>Risk Level</TableCell>
            <TableCell align="right">Monthly Burden</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((a) => (
            <TableRow
              key={a.id}
              hover
              selected={selected.has(a.id)}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.has(a.id)}
                  onChange={() => onToggleSelect(a.id)}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 18 }}>
                    {CATEGORY_ICONS[a.category] ?? '\u{1F4E6}'}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    noWrap
                    sx={{ maxWidth: 200 }}
                  >
                    {a.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                {a.score != null && a.projected_vulnerability_bucket ? (
                  <ScoreRing
                    score={a.score}
                    bucket={a.projected_vulnerability_bucket}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {'\u2014'}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {a.projected_vulnerability_bucket ? (
                  <Chip
                    label={BUCKET_LABELS[a.projected_vulnerability_bucket]}
                    size="small"
                    sx={{
                      bgcolor:
                        BUCKET_COLORS[a.projected_vulnerability_bucket],
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {'\u2014'}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {a.monthly_burden_cents != null
                    ? cents(a.monthly_burden_cents) + '/mo'
                    : '\u2014'}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip status={a.status} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(a.created_at)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={(e) => onMenuOpen(e, a)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">
                  No analyses match your filters.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Mobile Cards ───────────────────────────────────────────────────────

function MobileCards({
  items,
  onMenuOpen,
}: {
  items: AnalysisSummary[];
  onMenuOpen: (
    event: React.MouseEvent<HTMLElement>,
    analysis: AnalysisSummary,
  ) => void;
}) {
  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      {items.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No analyses match your filters.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: 20 }}>
                      {CATEGORY_ICONS[a.category] ?? '\u{1F4E6}'}
                    </Typography>
                    <Typography variant="subtitle2" noWrap>
                      {a.name}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={(e) => onMenuOpen(e, a)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}
                >
                  {a.score != null && a.projected_vulnerability_bucket ? (
                    <>
                      <ScoreRing
                        score={a.score}
                        bucket={a.projected_vulnerability_bucket}
                      />
                      <Chip
                        label={
                          BUCKET_LABELS[a.projected_vulnerability_bucket]
                        }
                        size="small"
                        sx={{
                          bgcolor:
                            BUCKET_COLORS[a.projected_vulnerability_bucket],
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      />
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not scored yet
                    </Typography>
                  )}
                  <StatusChip status={a.status} />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 1.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {a.monthly_burden_cents != null
                      ? cents(a.monthly_burden_cents) + '/mo'
                      : 'No burden'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(a.created_at)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Confirm Delete Dialog ──────────────────────────────────────────────

function ConfirmDeleteDialog({
  open,
  count,
  isPending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  count: number;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>
        Delete {count === 1 ? 'Analysis' : `${count} Analyses`}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {count === 1
            ? 'Are you sure you want to delete this analysis? This action cannot be undone.'
            : `Are you sure you want to delete ${count} analyses? This action cannot be undone.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isPending}
        >
          {isPending ? 'Deleting\u2026' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={300} height={24} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Skeleton variant="rounded" width={300} height={36} />
        <Skeleton variant="rounded" width={140} height={36} />
        <Skeleton variant="rounded" width={160} height={36} />
        <Skeleton
          variant="rounded"
          height={36}
          sx={{ flex: 1, minWidth: 200 }}
        />
      </Box>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={56}
          sx={{ mb: 1, borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function AnalysesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Filter & pagination state
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Delete dialog state
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  // Row actions menu state
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    analysis: AnalysisSummary;
  } | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState('');

  // ── Data fetching ──────────────────────────────────────────────

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page + 1));
    params.set('limit', String(ROWS_PER_PAGE));
    if (category !== 'all') params.set('category', category);
    if (status !== 'all') params.set('status', status);
    params.set('sort', SORT_CONFIG[sort].param);
    return params.toString();
  }, [page, category, status, sort]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analyses', { page, category, status, sort }],
    queryFn: async () => {
      const { data } = await api.get(`/analyses?${queryParams}`);
      return data as PaginatedAnalyses;
    },
  });

  // Client-side search filter
  const filteredItems = useMemo(() => {
    if (!data?.data) return [];
    if (!search.trim()) return data.data;
    const q = search.toLowerCase();
    return data.data.filter((a) => a.name.toLowerCase().includes(q));
  }, [data?.data, search]);

  // Quick stats
  const total = data?.meta.total ?? 0;
  const showStats = total >= 3;
  const stats = useMemo(() => {
    if (!data) return null;
    if (data.stats) {
      return {
        total: data.meta.total,
        highestScore: data.stats.highest_score,
        avgScore: data.stats.average_score,
        activeBurdens: data.stats.active_burdens_count,
      };
    }
    // Fallback: compute from current page
    const scored = data.data.filter((a) => a.score != null);
    const scores = scored.map((a) => a.score!);
    const activeBurdens = data.data.filter(
      (a) =>
        a.status === 'active' &&
        a.monthly_burden_cents != null &&
        a.monthly_burden_cents > 0,
    );
    return {
      total: data.meta.total,
      highestScore: scores.length > 0 ? Math.max(...scores) : null,
      avgScore:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null,
      activeBurdens: activeBurdens.length,
    };
  }, [data]);

  // ── Mutations ──────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['analyses'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 1) {
        await api.delete(`/analyses/${ids[0]}`);
      } else {
        await api.post('/analyses/bulk-delete', { ids });
      }
    },
    onSuccess: (_, ids) => {
      invalidate();
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteIds([]);
      setSnackbar(
        ids.length === 1
          ? 'Analysis deleted'
          : `${ids.length} analyses deleted`,
      );
    },
  });

  const reRunMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/analyses/${id}/re-run`);
    },
    onSuccess: () => {
      invalidate();
      setSnackbar('Analysis updated');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/analyses/${id}/duplicate`);
      return data;
    },
    onSuccess: (newCase) => {
      invalidate();
      router.push(`/analyses/${newCase.id}/inputs`);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(0);
    setSelected(new Set());
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(0);
    setSelected(new Set());
  };

  const handleSortChange = (val: SortOption) => {
    setSort(val);
    setPage(0);
  };

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const allOnPage = filteredItems.map((a) => a.id);
    const allSelected = allOnPage.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allOnPage.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allOnPage]));
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    analysis: AnalysisSummary,
  ) => {
    setMenuAnchor({ el: event.currentTarget, analysis });
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleMenuAction = (
    action: 'view' | 'rerun' | 'duplicate' | 'delete',
  ) => {
    if (!menuAnchor) return;
    const { analysis } = menuAnchor;
    handleMenuClose();

    switch (action) {
      case 'view':
        router.push(`/analyses/${analysis.id}/results`);
        break;
      case 'rerun':
        reRunMutation.mutate(analysis.id);
        break;
      case 'duplicate':
        duplicateMutation.mutate(analysis.id);
        break;
      case 'delete':
        setDeleteIds([analysis.id]);
        break;
    }
  };

  // ── Render ────────────────────────────────────────────────────

  if (isLoading) return <PageSkeleton />;

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
        Failed to load analyses.
      </Alert>
    );
  }

  const hasNoAnalyses =
    total === 0 && category === 'all' && status === 'all';

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
        Analysis History
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review and manage all your purchase analyses.
      </Typography>

      {hasNoAnalyses ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No analyses yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Start by analyzing a purchase to see how it impacts your
              finances.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/analyses/new')}
            >
              New Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {showStats && stats && (
            <QuickStatsBar
              total={stats.total}
              highestScore={stats.highestScore}
              avgScore={stats.avgScore}
              activeBurdens={stats.activeBurdens}
            />
          )}

          <FilterBar
            category={category}
            onCategoryChange={handleCategoryChange}
            status={status}
            onStatusChange={handleStatusChange}
            sort={sort}
            onSortChange={handleSortChange}
            search={search}
            onSearchChange={setSearch}
          />

          <BulkActionsBar
            count={selected.size}
            onDelete={() => setDeleteIds([...selected])}
          />

          <DesktopTable
            items={filteredItems}
            selected={selected}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onMenuOpen={handleMenuOpen}
          />

          <MobileCards items={filteredItems} onMenuOpen={handleMenuOpen} />

          <TablePagination
            component="div"
            count={search.trim() ? filteredItems.length : total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[20]}
            sx={{ mt: 1 }}
          />
        </>
      )}

      {/* Row Actions Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={!!menuAnchor}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuAction('rerun')}
          disabled={reRunMutation.isPending}
        >
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Re-run</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuAction('duplicate')}
          disabled={duplicateMutation.isPending}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuAction('delete')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteIds.length > 0}
        count={deleteIds.length}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteIds)}
        onCancel={() => setDeleteIds([])}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}

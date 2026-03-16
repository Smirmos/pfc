'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { cents, type ScenarioRow } from '../types';

interface ScenarioTableProps {
  scenarios: ScenarioRow[];
}

function DeltaValue({
  value,
  suffix,
  invert,
}: {
  value: number;
  suffix: string;
  /** When true, a negative value is good (e.g., lower cost) */
  invert?: boolean;
}) {
  if (value === 0) return <span>—</span>;

  const isPositive = value > 0;
  const isBetter = invert ? !isPositive : isPositive;

  const formatted =
    suffix === '/mo' || suffix === ' cost'
      ? `${isPositive ? '+' : ''}${cents(value)}${suffix}`
      : `${isPositive ? '+' : ''}${value}${suffix}`;

  return (
    <Typography
      component="span"
      variant="body2"
      fontWeight={600}
      sx={{ color: isBetter ? '#2e7d32' : '#c62828' }}
    >
      {formatted}
    </Typography>
  );
}

function ScenarioRowItem({
  scenario,
  isBase,
}: {
  scenario: ScenarioRow;
  isBase: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        hover
        onClick={() => !isBase && setOpen(!open)}
        sx={{
          cursor: isBase ? 'default' : 'pointer',
          ...(isBase && {
            bgcolor: 'primary.main',
            '& .MuiTableCell-root': { color: '#fff', fontWeight: 600 },
            '&:hover': { bgcolor: 'primary.main' },
          }),
        }}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {!isBase &&
              (open ? (
                <KeyboardArrowUpIcon fontSize="small" />
              ) : (
                <KeyboardArrowDownIcon fontSize="small" />
              ))}
            {scenario.label}
          </Box>
        </TableCell>
        <TableCell align="right">{cents(scenario.monthlyBurdenCents)}</TableCell>
        <TableCell align="right">{cents(scenario.freeCashCents)}</TableCell>
        <TableCell align="right">{scenario.score}</TableCell>
        <TableCell align="right">{cents(scenario.totalCostCents)}</TableCell>
      </TableRow>
      {!isBase && (
        <TableRow>
          <TableCell
            colSpan={5}
            sx={{ py: 0, borderBottom: open ? undefined : 'none' }}
          >
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  py: 1.5,
                  px: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Monthly Cost
                  </Typography>
                  <br />
                  <DeltaValue
                    value={scenario.delta_vs_base.monthly_burden}
                    suffix="/mo"
                    invert
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Free Cash
                  </Typography>
                  <br />
                  <DeltaValue
                    value={scenario.delta_vs_base.projected_free_cash}
                    suffix="/mo"
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Score
                  </Typography>
                  <br />
                  <DeltaValue
                    value={scenario.delta_vs_base.score}
                    suffix=" score"
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Cost
                  </Typography>
                  <br />
                  <DeltaValue
                    value={scenario.delta_vs_base.total_long_term_cost}
                    suffix=" cost"
                    invert
                  />
                </Box>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function ScenarioTable({ scenarios }: ScenarioTableProps) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Scenario Comparison
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scenario</TableCell>
              <TableCell align="right">Monthly Cost</TableCell>
              <TableCell align="right">Free Cash Left</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Total Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scenarios.map((s) => (
              <ScenarioRowItem
                key={s.id}
                scenario={s}
                isBase={s.scenarioType === 'BASE'}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

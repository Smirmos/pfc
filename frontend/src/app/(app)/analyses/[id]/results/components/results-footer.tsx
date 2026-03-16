'use client';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  BUCKET_LABELS,
  EMERGENCY_LABELS,
  cents,
  type Assumptions,
} from '../types';

interface ResultsFooterProps {
  disclaimer: string;
  assumptions: Assumptions;
}

export default function ResultsFooter({
  disclaimer,
  assumptions,
}: ResultsFooterProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 2 }}
      >
        {disclaimer}
      </Typography>

      <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" fontWeight={600}>
            Calculation assumptions
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Row
              label="Buffer Source"
              value={
                assumptions.buffer_source === 'user_defined'
                  ? 'User Defined'
                  : 'Default (17.5%)'
              }
            />
            <Row
              label="Emergency Fund Level"
              value={
                <Chip
                  label={EMERGENCY_LABELS[assumptions.emergency_fund_level]}
                  size="small"
                  color={
                    assumptions.emergency_fund_level === 'critical'
                      ? 'error'
                      : assumptions.emergency_fund_level === 'low'
                        ? 'warning'
                        : 'success'
                  }
                  variant="outlined"
                />
              }
            />
            <Row
              label="Pre-Purchase Free Cash"
              value={cents(assumptions.pre_purchase_free_cash)}
            />
            <Row
              label="Pre-Purchase Vulnerability"
              value={BUCKET_LABELS[assumptions.pre_purchase_vulnerability]}
            />
            <Row
              label="Calculation Version"
              value={assumptions.calculation_version}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography variant="body2">{value}</Typography>
      ) : (
        value
      )}
    </Box>
  );
}

'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import BoltIcon from '@mui/icons-material/Bolt';

export default function ImpulsePage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <BoltIcon sx={{ color: 'warning.main', fontSize: 32 }} />
        <Typography variant="h4">Impulse Check</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Quick impulse purchase checker coming soon. Describe what you want to
            buy and get an instant reality check.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

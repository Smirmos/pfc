'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function HistoryPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Analysis History
      </Typography>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Your past analyses will appear here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

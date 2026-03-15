'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function AnalysisPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        New Analysis
      </Typography>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Full purchase analysis wizard coming soon. Enter details about a
            planned purchase and receive a comprehensive financial breakdown.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

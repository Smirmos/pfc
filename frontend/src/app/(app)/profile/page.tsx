'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useAuth } from '@/context/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Profile
      </Typography>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Email:</strong> {user?.email}
          </Typography>
          {user?.firstName && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>First name:</strong> {user.firstName}
            </Typography>
          )}
          {user?.lastName && (
            <Typography variant="body1">
              <strong>Last name:</strong> {user.lastName}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

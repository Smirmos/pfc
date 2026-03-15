'use client';

import Box from '@mui/material/Box';
import Sidebar from '@/components/sidebar';
import BottomNav from '@/components/bottom-nav';
import ProtectedRoute from '@/components/protected-route';

const DRAWER_WIDTH = 260;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 4 },
            pb: { xs: 10, md: 4 },
            bgcolor: 'background.default',
            ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
            width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          }}
        >
          {children}
        </Box>
        <BottomNav />
      </Box>
    </ProtectedRoute>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BoltIcon from '@mui/icons-material/Bolt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Impulse', href: '/impulse', icon: <BoltIcon /> },
  { label: 'Analysis', href: '/analyses/new', icon: <AddCircleOutlineIcon /> },
  { label: 'History', href: '/analysis/history', icon: <HistoryIcon /> },
  { label: 'Profile', href: '/profile', icon: <PersonIcon /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const currentIndex = navItems.findIndex((item) => pathname === item.href);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'block', md: 'none' },
      }}
      elevation={3}
    >
      <BottomNavigation
        value={currentIndex === -1 ? 0 : currentIndex}
        onChange={(_, newValue) => {
          router.push(navItems[newValue].href);
        }}
        showLabels
        sx={{
          '& .Mui-selected': {
            color: 'primary.main',
          },
          '& .MuiBottomNavigationAction-root:nth-of-type(2).Mui-selected': {
            color: 'warning.main',
          },
        }}
      >
        {navItems.map(({ label, icon }) => (
          <BottomNavigationAction key={label} label={label} icon={icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BoltIcon from '@mui/icons-material/Bolt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/context/auth-context';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  {
    label: 'Impulse Check',
    href: '/impulse',
    icon: BoltIcon,
    accent: true,
  },
  { label: 'New Analysis', href: '/analyses/new', icon: AddCircleOutlineIcon },
  { label: 'History', href: '/analyses', icon: HistoryIcon },
  { label: 'Profile', href: '/profile', icon: PersonIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#FAFBFC',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} color="primary.main">
          PFC Advisor
        </Typography>
        {user && (
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        )}
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 2, flex: 1 }}>
        {navItems.map(({ label, href, icon: Icon, accent }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <ListItem key={href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={href}
                selected={active}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: accent
                      ? 'rgba(245, 158, 11, 0.10)'
                      : 'rgba(31, 78, 121, 0.08)',
                    '&:hover': {
                      bgcolor: accent
                        ? 'rgba(245, 158, 11, 0.16)'
                        : 'rgba(31, 78, 121, 0.12)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: accent
                      ? 'warning.main'
                      : active
                        ? 'primary.main'
                        : 'text.secondary',
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontWeight: active ? 600 : 400,
                    color: accent
                      ? 'warning.dark'
                      : active
                        ? 'primary.main'
                        : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => void logout()}
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Log out" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}

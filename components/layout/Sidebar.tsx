'use client';

import {
  Box, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, Collapse,
} from '@mui/material';
import DashboardIcon      from '@mui/icons-material/Dashboard';
import DirectionsCarIcon  from '@mui/icons-material/DirectionsCar';
import SettingsIcon       from '@mui/icons-material/Settings';
import ExpandLessIcon     from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import PlaylistAddIcon    from '@mui/icons-material/PlaylistAdd';
import WarningAmberIcon   from '@mui/icons-material/WarningAmber';
import EventBusyIcon      from '@mui/icons-material/EventBusy';
import HistoryIcon        from '@mui/icons-material/History';
import TrackChangesIcon   from '@mui/icons-material/TrackChanges';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CategoryIcon       from '@mui/icons-material/Category';
import FavoriteIcon       from '@mui/icons-material/Favorite';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EngineeringIcon    from '@mui/icons-material/Engineering';
import FireplaceIcon      from '@mui/icons-material/Fireplace';
import GroupsIcon         from '@mui/icons-material/Groups';
import BarChartIcon       from '@mui/icons-material/BarChart';
import TuneIcon           from '@mui/icons-material/Tune';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import { useState } from 'react';

export const SIDEBAR_WIDTH = 256;

interface NavChild { label: string; href: string; icon: React.ReactNode; hidden?: boolean }
interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavChild[];
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  {
    label: 'Vehicle Records',
    icon: <DirectionsCarIcon />,
    children: [
      { label: 'Vehicle List',      href: '/vehicle-records',                 icon: <DirectionsCarIcon fontSize="small" /> },
      { label: 'Add Vehicle',       href: '/vehicle-records/add',             icon: <PlaylistAddIcon fontSize="small" /> },
      { label: 'Expiring Policies', href: '/vehicle-records/expiring',        icon: <WarningAmberIcon fontSize="small" />, hidden: true },
      { label: 'Expired Policies',  href: '/vehicle-records/expired',         icon: <EventBusyIcon fontSize="small" />,   hidden: true },
      { label: 'Renewal History',   href: '/vehicle-records/renewal-history', icon: <HistoryIcon fontSize="small" />,     hidden: true },
    ],
  },
  {
    label: 'Health Insurance',
    icon: <FavoriteIcon />,
    children: [
      { label: 'Health Records',      href: '/health-records',                  icon: <MedicalServicesIcon fontSize="small" /> },
      { label: 'Add Health Policy',   href: '/health-records/add',              icon: <PlaylistAddIcon fontSize="small" /> },
      { label: 'Expiring Policies',   href: '/health-records/expiring',         icon: <WarningAmberIcon fontSize="small" />,  hidden: true },
      { label: 'Expired Policies',    href: '/health-records/expired',          icon: <EventBusyIcon fontSize="small" />,     hidden: true },
      { label: 'Track Renewals',      href: '/health-records/track',            icon: <TrackChangesIcon fontSize="small" />,  hidden: true },
      { label: 'Renewal History',     href: '/health-records/renewal-history',  icon: <HistoryIcon fontSize="small" />,       hidden: true },
    ],
  },
  {
    label: 'Fire Insurance',
    icon: <LocalFireDepartmentIcon />,
    children: [
      { label: 'Fire Records',      href: '/fire-records',                 icon: <FireplaceIcon fontSize="small" /> },
      { label: 'Add Fire Policy',   href: '/fire-records/add',             icon: <PlaylistAddIcon fontSize="small" /> },
      { label: 'Expiring Policies', href: '/fire-records/expiring',        icon: <WarningAmberIcon fontSize="small" />, hidden: true },
      { label: 'Expired Policies',  href: '/fire-records/expired',         icon: <EventBusyIcon fontSize="small" />,   hidden: true },
      { label: 'Track Renewals',    href: '/fire-records/track',           icon: <TrackChangesIcon fontSize="small" />, hidden: true },
      { label: 'Renewal History',   href: '/fire-records/renewal-history', icon: <HistoryIcon fontSize="small" />,     hidden: true },
    ],
  },
  {
    label: 'Labour Insurance',
    icon: <EngineeringIcon />,
    children: [
      { label: 'Labour Records',    href: '/labour-records',                 icon: <GroupsIcon fontSize="small" /> },
      { label: 'Add Labour Policy', href: '/labour-records/add',             icon: <PlaylistAddIcon fontSize="small" /> },
      { label: 'Expiring Policies', href: '/labour-records/expiring',        icon: <WarningAmberIcon fontSize="small" />, hidden: true },
      { label: 'Expired Policies',  href: '/labour-records/expired',         icon: <EventBusyIcon fontSize="small" />,   hidden: true },
      { label: 'Track Renewals',    href: '/labour-records/track',           icon: <TrackChangesIcon fontSize="small" />, hidden: true },
      { label: 'Renewal History',   href: '/labour-records/renewal-history', icon: <HistoryIcon fontSize="small" />,     hidden: true },
    ],
  },
  {
    label: 'Analytics',
    icon: <BarChartIcon />,
    children: [
      { label: 'Vehicle Analytics', href: '/analytics/vehicle', icon: <DirectionsCarIcon fontSize="small" /> },
      { label: 'Health Analytics',  href: '/analytics/health',  icon: <FavoriteIcon fontSize="small" /> },
      { label: 'Fire Analytics',    href: '/analytics/fire',    icon: <LocalFireDepartmentIcon fontSize="small" /> },
      { label: 'Labour Analytics',  href: '/analytics/labour',  icon: <EngineeringIcon fontSize="small" /> },
    ],
  },
  { label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
  {
    label: 'Admin',
    icon: <AdminPanelSettingsIcon />,
    children: [
      { label: 'Manage Categories', href: '/admin/categories',   icon: <CategoryIcon fontSize="small" /> },
      { label: 'Lead Sources',      href: '/admin/lead-sources', icon: <TuneIcon fontSize="small" /> },
    ],
  },
];

const btnSx = (active: boolean) => ({
  borderRadius: 2,
  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
  bgcolor: active ? 'rgba(255,255,255,0.14)' : 'transparent',
  '&:hover': { bgcolor: 'rgba(255,255,255,0.09)', color: '#fff' },
  py: 1,
});

function SidebarContent() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Vehicle Records': true, 'Health Insurance': true,
    'Fire Insurance': true, 'Labour Insurance': true, 'Analytics': false,
  });

  const toggle = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0d1b6e' }}>
      {/* Logo */}
      <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/companylogo.png" alt="A2 Insurance" style={{ height: 44, width: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain' }} />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      <List sx={{ px: 1, pt: 1.5, flex: 1, overflowY: 'auto' }}>
        {NAV.map((item) => {
          if (item.children) {
            const groupActive = item.children.some((c) => pathname.startsWith(c.href));
            const open = openGroups[item.label] ?? groupActive;

            return (
              <Box key={item.label}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton onClick={() => toggle(item.label)} sx={btnSx(groupActive)}>
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: groupActive ? 600 : 400 } } }}
                    />
                    {open ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  </ListItemButton>
                </ListItem>

                <Collapse in={open} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1.5 }}>
                    {item.children.filter((c) => !c.hidden).map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <ListItem key={child.href} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            component={NextLink}
                            href={child.href}
                            sx={btnSx(childActive)}
                          >
                            <ListItemIcon sx={{ color: 'inherit', minWidth: 30 }}>{child.icon}</ListItemIcon>
                            <ListItemText
                              primary={child.label}
                              slotProps={{ primary: { sx: { fontSize: '0.8125rem', fontWeight: childActive ? 600 : 400 } } }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          const active = pathname === item.href;
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton component={NextLink} href={item.href!} sx={btnSx(active)}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: active ? 600 : 400 } } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

interface SidebarProps { mobileOpen: boolean; onClose: () => void }

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary" open={mobileOpen} onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 'none' } }}
      >
        <SidebarContent />
      </Drawer>
      <Drawer
        variant="permanent" open
        sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 'none' } }}
      >
        <SidebarContent />
      </Drawer>
    </Box>
  );
}

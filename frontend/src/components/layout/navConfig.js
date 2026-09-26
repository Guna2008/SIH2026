import {
  LayoutDashboard, Boxes, HandHeart, Salad, Package, Recycle, Warehouse, UserRound,
  BarChart3, UserCircle, Building2, ShieldCheck, Soup, FileBarChart, ClipboardList,
} from 'lucide-react'

export const NAV_CONFIG = {
  NGO: [
    { to: '/ngo/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ngo/food', label: 'Available food', icon: Salad },
    { to: '/ngo/claims', label: 'My claims', icon: HandHeart },
    { to: '/ngo/profile', label: 'Profile', icon: UserCircle },
  ],
  ORPHANAGE: [
    { to: '/orphanage/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orphanage/food', label: 'Available food', icon: Salad },
    { to: '/orphanage/claims', label: 'My claims', icon: HandHeart },
    { to: '/orphanage/requirements', label: 'Requirements', icon: ClipboardList },
    { to: '/orphanage/profile', label: 'Profile', icon: UserCircle },
  ],
  KITCHEN: [
    { to: '/kitchen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/kitchen/inventory', label: 'Inventory', icon: Boxes },
    { to: '/kitchen/production', label: 'Production', icon: Soup },
    { to: '/kitchen/surplus', label: 'Surplus', icon: Package },
    { to: '/kitchen/donations', label: 'Donations', icon: HandHeart },
    { to: '/kitchen/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/kitchen/profile', label: 'Profile', icon: UserCircle },
  ],
  FOOD_BANK: [
    { to: '/food-bank/dashboard', label: 'Food bank dashboard', icon: LayoutDashboard },
    { to: '/food-bank/food', label: 'Available food', icon: Salad },
  ],
  INDIVIDUAL: [
    { to: '/individual/dashboard', label: 'My surplus & food', icon: LayoutDashboard },
    { to: '/individual/food', label: 'Marketplace', icon: Salad },
  ],
  BIOGAS_PLANT: [
    { to: '/biogas/dashboard', label: 'Biogas dashboard', icon: LayoutDashboard },
    { to: '/biogas/food', label: 'Organic waste', icon: Recycle },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
    { to: '/admin/food', label: 'Food listings', icon: Salad },
    { to: '/admin/claims', label: 'Claims', icon: HandHeart },
    { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  ],
}

export const ROLE_TITLE = {
  NGO: 'Social Welfare Organization',
  ORPHANAGE: 'Social Welfare Organization',
  KITCHEN: 'Institutional Kitchen',
  ADMIN: 'Platform Admin',
  FOOD_BANK: 'Food Bank',
  INDIVIDUAL: 'Individual / Function Hall',
  BIOGAS_PLANT: 'Biogas Plant',
}

export const ROLE_ICON = {
  NGO: HandHeart,
  ORPHANAGE: HandHeart,
  KITCHEN: Soup,
  ADMIN: ShieldCheck,
  FOOD_BANK: Warehouse,
  INDIVIDUAL: UserRound,
  BIOGAS_PLANT: Recycle,
}

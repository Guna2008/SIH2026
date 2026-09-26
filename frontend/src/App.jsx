import { Navigate, Routes, Route } from 'react-router-dom'

import LandingPage from './pages/LandingPage'

import LoginPage from './pages/auth/LoginPage'
import AdminLoginPage from './pages/auth/AdminLoginPage'
import SignupPage from './pages/auth/SignupPage'
import SignupSocialWelfarePage from './pages/auth/SignupSocialWelfarePage'
import SignupKitchenPage from './pages/auth/SignupKitchenPage'
import SignupFoodBankPage from './pages/auth/SignupFoodBankPage'
import SignupIndividualPage from './pages/auth/SignupIndividualPage'
import SignupBiogasPage from './pages/auth/SignupBiogasPage'
import MarketplacePage from './pages/marketplace/MarketplacePage'
import FoodBankDashboard from './pages/foodbank/FoodBankDashboard'

import NgoDashboard from './pages/ngo/NgoDashboard'
import NgoFood from './pages/ngo/NgoFood'
import NgoClaims from './pages/ngo/NgoClaims'
import NgoProfile from './pages/ngo/NgoProfile'

import OrphanageDashboard from './pages/orphanage/OrphanageDashboard'
import OrphanageFood from './pages/orphanage/OrphanageFood'
import OrphanageClaims from './pages/orphanage/OrphanageClaims'
import OrphanageRequirements from './pages/orphanage/OrphanageRequirements'
import OrphanageProfile from './pages/orphanage/OrphanageProfile'

import KitchenDashboard from './pages/kitchen/KitchenDashboard'
import KitchenInventory from './pages/kitchen/KitchenInventory'
import KitchenProduction from './pages/kitchen/KitchenProduction'
import KitchenSurplus from './pages/kitchen/KitchenSurplus'
import KitchenDonations from './pages/kitchen/KitchenDonations'
import KitchenAnalytics from './pages/kitchen/KitchenAnalytics'
import KitchenProfile from './pages/kitchen/KitchenProfile'

import BiogasDashboard from './pages/biogas/BiogasDashboard'
import BiogasFood from './pages/biogas/BiogasFood'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrganizations from './pages/admin/AdminOrganizations'
import AdminOrganizationDetail from './pages/admin/AdminOrganizationDetail'
import AdminFood from './pages/admin/AdminFood'
import AdminClaims from './pages/admin/AdminClaims'
import AdminInventory from './pages/admin/AdminInventory'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminReports from './pages/admin/AdminReports'

import ProtectedRoute from './routes/ProtectedRoute'
import RoleProtectedRoute from './routes/RoleProtectedRoute'
import { ROLES } from './lib/roles'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/signup/social-welfare" element={<SignupSocialWelfarePage />} />
      {/* Keep old links working while the public registration flow is unified. */}
      <Route path="/signup/ngo" element={<Navigate to="/signup/social-welfare" replace />} />
      <Route path="/signup/orphanage" element={<Navigate to="/signup/social-welfare" replace />} />
      <Route path="/signup/kitchen" element={<SignupKitchenPage />} />
      <Route path="/signup/food-bank" element={<SignupFoodBankPage />} />
      <Route path="/signup/individual" element={<SignupIndividualPage />} />
      <Route path="/signup/biogas" element={<SignupBiogasPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleProtectedRoute allow={[ROLES.NGO]} />}>
          <Route path="/ngo/dashboard" element={<NgoDashboard />} />
          <Route path="/ngo/food" element={<NgoFood />} />
          <Route path="/ngo/claims" element={<NgoClaims />} />
          <Route path="/ngo/profile" element={<NgoProfile />} />
        </Route>

        <Route element={<RoleProtectedRoute allow={[ROLES.ORPHANAGE]} />}>
          <Route path="/orphanage/dashboard" element={<OrphanageDashboard />} />
          <Route path="/orphanage/food" element={<OrphanageFood />} />
          <Route path="/orphanage/claims" element={<OrphanageClaims />} />
          <Route path="/orphanage/requirements" element={<OrphanageRequirements />} />
          <Route path="/orphanage/profile" element={<OrphanageProfile />} />
        </Route>

        <Route element={<RoleProtectedRoute allow={[ROLES.KITCHEN]} />}>
          <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
          <Route path="/kitchen/inventory" element={<KitchenInventory />} />
          <Route path="/kitchen/production" element={<KitchenProduction />} />
          <Route path="/kitchen/surplus" element={<KitchenSurplus />} />
          <Route path="/kitchen/donations" element={<KitchenDonations />} />
          <Route path="/kitchen/analytics" element={<KitchenAnalytics />} />
          <Route path="/kitchen/profile" element={<KitchenProfile />} />
        </Route>

        <Route element={<RoleProtectedRoute allow={[ROLES.FOOD_BANK]} />}>
          <Route path="/food-bank/dashboard" element={<FoodBankDashboard />} />
          <Route path="/food-bank/food" element={<FoodBankDashboard />} />
        </Route>
        <Route element={<RoleProtectedRoute allow={[ROLES.INDIVIDUAL]} />}>
          <Route path="/individual/dashboard" element={<MarketplacePage />} />
          <Route path="/individual/food" element={<MarketplacePage />} />
        </Route>
        <Route element={<RoleProtectedRoute allow={[ROLES.BIOGAS_PLANT]} />}>
          <Route path="/biogas/dashboard" element={<BiogasDashboard />} />
          <Route path="/biogas/food" element={<BiogasFood />} />
        </Route>

        <Route element={<RoleProtectedRoute allow={[ROLES.ADMIN]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/admin/organizations/:id" element={<AdminOrganizationDetail />} />
          <Route path="/admin/food" element={<AdminFood />} />
          <Route path="/admin/claims" element={<AdminClaims />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

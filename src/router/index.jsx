import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../app/AppLayout'
import AboutPage from '../pages/AboutPage'
import ContactPage from '../pages/ContactPage'
import DashboardHomePage from '../pages/DashboardHomePage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import AdminLoginPage from '../pages/AdminLoginPage'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import AdminMerchantsPage from '../pages/admin/AdminMerchantsPage'
import AdminMarketingPage from '../pages/admin/AdminMarketingPage'
import AdminMerchantPage from '../pages/admin/AdminMerchantPage'
import AdminSubscriptionsPage from '../pages/admin/AdminSubscriptionsPage'
import AdminBookingsPage from '../pages/admin/AdminBookingsPage'
import AdminCalendarsPage from '../pages/admin/AdminCalendarsPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminSettingsPage from '../pages/admin/AdminSettingsPage'
import AdminLayout from '../layouts/AdminLayout'
import ConfigurationPage from '../pages/ConfigurationPage'
import BookingsPage from '../pages/BookingsPage'
import BookingDetailPage from '../pages/BookingDetailPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import HelpPage from '../pages/HelpPage'
import CalendarPage from '../pages/CalendarPage'
import BookingPortalsPage from '../pages/BookingPortalsPage'
import DiscountPage from '../pages/DiscountPage'
import MessagesPage from '../pages/MessagesPage'
import CustomersPage from '../pages/CustomersPage'
import AdvancedPage from '../pages/AdvancedPage'
import BillingPage from '../pages/BillingPage'
import BillingCheckoutPage from '../pages/BillingCheckoutPage'
import DirectWebsiteBuilderPage from '../pages/DirectWebsiteBuilderPage'
import DirectPortalDesignPage from '../pages/DirectPortalDesignPage'
import PublicDirectPortalPage from '../pages/PublicDirectPortalPage'
import DirectPortalBookPage from '../pages/DirectPortalBookPage'
import NotFoundPage from '../pages/NotFoundPage'
import RegisterPage from '../pages/RegisterPage'
import ServicesPage from '../pages/ServicesPage'
import MerchantLayout from '../layouts/MerchantLayout'
import MarketingLoginPage from '../pages/MarketingLoginPage'
import MarketingDashboardPage from '../pages/marketing/MarketingDashboardPage'
import MarketingTargetsPage from '../pages/marketing/MarketingTargetsPage'
import MarketingLayout from '../layouts/MarketingLayout'
import { isAdminAuthenticated, isMarketingAuthenticated, isMerchantAuthenticated } from '../utils/auth'

function ProtectedRoute({ children }) {
  if (!isMerchantAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicOnly({ children }) {
  if (isMerchantAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function ProtectedAdminRoute({ children }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function ProtectedMarketingRoute({ children }) {
  if (!isMarketingAuthenticated()) {
    return <Navigate to="/marketing/login" replace />
  }

  return children
}

function PublicMarketingOnly({ children }) {
  if (isMarketingAuthenticated()) {
    return <Navigate to="/marketing" replace />
  }

  return children
}

function PublicAdminOnly({ children }) {
  if (isAdminAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />
      <Route
        path="/marketing/login"
        element={
          <PublicMarketingOnly>
            <MarketingLoginPage />
          </PublicMarketingOnly>
        }
      />
      <Route
        element={
          <ProtectedMarketingRoute>
            <MarketingLayout />
          </ProtectedMarketingRoute>
        }
      >
        <Route path="/marketing" element={<MarketingDashboardPage />} />
        <Route path="/marketing/targets" element={<MarketingTargetsPage />} />
      </Route>
      <Route
        path="/admin/login"
        element={
          <PublicAdminOnly>
            <AdminLoginPage />
          </PublicAdminOnly>
        }
      />
      <Route
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/merchants" element={<AdminMerchantsPage />} />
        <Route path="/admin/merchants/:merchantId" element={<AdminMerchantPage />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="/admin/marketing" element={<AdminMarketingPage />} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/calendars" element={<AdminCalendarsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>
      <Route path="/:merchantSlug/directportal/book/:unitId" element={<DirectPortalBookPage />} />
      <Route path="/:merchantSlug/directportal" element={<PublicDirectPortalPage />} />
      <Route
        element={
          <ProtectedRoute>
            <MerchantLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/:bookingId" element={<BookingDetailPage />} />
        <Route path="/discount" element={<DiscountPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/bookingportals" element={<BookingPortalsPage />} />
        <Route path="/direct-website-builder" element={<DirectWebsiteBuilderPage />} />
        <Route path="/direct-portal-design" element={<DirectPortalDesignPage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/billing/checkout" element={<BillingCheckoutPage />} />
        <Route path="/billing/checkout/return" element={<BillingCheckoutPage />} />
        <Route path="/advance" element={<AdvancedPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes

import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../app/AppLayout'
import AboutPage from '../pages/AboutPage'
import ContactPage from '../pages/ContactPage'
import DashboardHomePage from '../pages/DashboardHomePage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import ConfigurationPage from '../pages/ConfigurationPage'
import BookingsPage from '../pages/BookingsPage'
import BookingDetailPage from '../pages/BookingDetailPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import MerchantPlaceholderPage from '../pages/MerchantPlaceholderPage'
import CalendarPage from '../pages/CalendarPage'
import BookingPortalsPage from '../pages/BookingPortalsPage'
import DiscountPage from '../pages/DiscountPage'
import DirectWebsiteBuilderPage from '../pages/DirectWebsiteBuilderPage'
import DirectPortalDesignPage from '../pages/DirectPortalDesignPage'
import PublicDirectPortalPage from '../pages/PublicDirectPortalPage'
import DirectPortalBookPage from '../pages/DirectPortalBookPage'
import NotFoundPage from '../pages/NotFoundPage'
import RegisterPage from '../pages/RegisterPage'
import ServicesPage from '../pages/ServicesPage'
import MerchantLayout from '../layouts/MerchantLayout'
import { isMerchantAuthenticated } from '../utils/auth'

function ProtectedRoute({ children }) {
  if (!isMerchantAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={isMerchantAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isMerchantAuthenticated() ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
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
        <Route path="/messages" element={<MerchantPlaceholderPage title="Messages" />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/bookingportals" element={<BookingPortalsPage />} />
        <Route path="/direct-website-builder" element={<DirectWebsiteBuilderPage />} />
        <Route path="/direct-portal-design" element={<DirectPortalDesignPage />} />
        <Route path="/marketplace" element={<MerchantPlaceholderPage title="Marketplace" />} />
        <Route path="/experience" element={<MerchantPlaceholderPage title="Experience" />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
        <Route path="/advance" element={<MerchantPlaceholderPage title="Advanced" />} />
        <Route path="/help" element={<MerchantPlaceholderPage title="Help" />} />
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

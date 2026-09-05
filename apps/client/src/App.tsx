import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { MarketingLayout } from "./features/marketing/layout/marketing-layout";
import { HomePage } from "./features/marketing/pages/home-page";
import { ServicesPage } from "./features/marketing/pages/services-page";
import { ContactPage } from "./features/marketing/pages/contact-page";
import { BlogListPage } from "./features/marketing/pages/blog-list-page";
import { BlogPostPage } from "./features/marketing/pages/blog-post-page";
import { TermsPage } from "./features/marketing/pages/terms-page";
import { PrivacyPage } from "./features/marketing/pages/privacy-page";
import { NewsletterConfirmPage } from "./features/marketing/pages/newsletter-confirm-page";
import { NewsletterUnsubscribePage } from "./features/marketing/pages/newsletter-unsubscribe-page";
import { NotFoundPage } from "./features/marketing/pages/not-found-page";
import { LoginPage } from "./features/auth/login-page";
import { RegisterPage } from "./features/auth/register-page";
import { OtpLoginPage } from "./features/auth/otp-login-page";
import { ForgotPasswordPage } from "./features/auth/forgot-password-page";
import { ResetPasswordPage } from "./features/auth/reset-password-page";
import { GoogleCallbackPage } from "./features/auth/google-callback-page";
import { DashboardPage } from "./features/dashboard/dashboard-page";
import { HomeReadinessQuizEntry } from "./features/quiz/home-readiness-quiz-page";
import { HomeReadinessResultPage } from "./features/quiz/home-readiness-result-page";
import { AreaQuizPage } from "./features/quiz/area-quiz-page";
import { AreaQuizResultPage } from "./features/quiz/area-quiz-result-page";
import { RecommendedPropertiesPage } from "./features/properties/recommended-properties-page";
import { PropertyDetailPage } from "./features/properties/property-detail-page";
import { BudgetCalculatorPage } from "./features/calculators/budget-calculator-page";
import { HiddenCostCalculatorPage } from "./features/calculators/hidden-cost-calculator-page";
import { RoiCalculatorPage } from "./features/calculators/roi-calculator-page";
import { InspectionBookingPage } from "./features/inspections/inspection-booking-page";
import { AdminUsersPage } from "./features/admin/admin-users-page";
import { AdminPropertiesPage } from "./features/admin/admin-properties-page";
import { AdminInspectionsPage } from "./features/admin/admin-inspections-page";
import { AdminCrmPage } from "./features/admin/admin-crm-page";
import { AdminEmailCampaignsPage } from "./features/admin/admin-email-campaigns-page";
import { AdminAnalyticsPage } from "./features/admin/admin-analytics-page";
import { AdminSettingsPage } from "./features/admin/admin-settings-page";
import { AdminAreasPage } from "./features/admin/admin-areas-page";
import { AdminPromptsPage } from "./features/admin/admin-prompts-page";
import { AdminLogsPage } from "./features/admin/admin-logs-page";
import { AdminBlogPage } from "./features/admin/admin-blog-page";
import { AdminNewsletterPage } from "./features/admin/admin-newsletter-page";
import { AdminContactMessagesPage } from "./features/admin/admin-contact-messages-page";
import { ProfileSettingsPage } from "./features/profile/profile-settings-page";
import { AdminSubAdminsPage } from "./features/admin/admin-sub-admins-page";
import { StorageCheckoutResultPage } from "./features/admin/storage-checkout-result-page";
import { ProtectedRoute } from "./components/protected-route";
import { KioskShell } from "./features/kiosk/kiosk-shell.js";
import { AttendancePage } from "./features/admin/attendance/attendance-page.js";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Public Marketing Website Layer */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/newsletter/confirm/:token" element={<NewsletterConfirmPage />} />
          <Route path="/newsletter/unsubscribe/:token" element={<NewsletterUnsubscribePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Auth & Decision Funnel Engine Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/otp" element={<OtpLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/google/success" element={<GoogleCallbackPage />} />
        
        {/* Kiosk — Public (no auth required) */}
        <Route path="/kiosk" element={<KioskShell />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute audience="customer">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/home-readiness"
          element={<HomeReadinessQuizEntry />}
        />
        <Route
          path="/quiz/home-readiness/result"
          element={
            <ProtectedRoute audience="customer">
              <HomeReadinessResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/area"
          element={
            <ProtectedRoute audience="customer">
              <AreaQuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/area/result"
          element={
            <ProtectedRoute audience="customer">
              <AreaQuizResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/recommended"
          element={
            <ProtectedRoute audience="customer">
              <RecommendedPropertiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id"
          element={
            <ProtectedRoute audience="customer">
              <PropertyDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calculators/budget/:propertyId"
          element={
            <ProtectedRoute audience="customer">
              <BudgetCalculatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calculators/hidden-cost/:propertyId"
          element={
            <ProtectedRoute audience="customer">
              <HiddenCostCalculatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calculators/roi/:propertyId"
          element={
            <ProtectedRoute audience="customer">
              <RoiCalculatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections/book"
          element={
            <ProtectedRoute audience="customer">
              <InspectionBookingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected owner and sub-admin operational routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute audience="admin" requiredMenu="users">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sub-admins"
          element={
            <ProtectedRoute role="admin">
              <AdminSubAdminsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/properties"
          element={
            <ProtectedRoute audience="admin" requiredMenu="properties">
              <AdminPropertiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inspections"
          element={
            <ProtectedRoute audience="admin" requiredMenu="inspections">
              <AdminInspectionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/crm"
          element={
            <ProtectedRoute audience="admin" requiredMenu="crm">
              <AdminCrmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contact-messages"
          element={
            <ProtectedRoute audience="admin" requiredMenu="contact-messages">
              <AdminContactMessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blog"
          element={
            <ProtectedRoute audience="admin" requiredMenu="blog">
              <AdminBlogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/newsletter"
          element={
            <ProtectedRoute audience="admin" requiredMenu="newsletter">
              <AdminNewsletterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/email-campaigns"
          element={
            <ProtectedRoute audience="admin" requiredMenu="email-campaigns">
              <AdminEmailCampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute audience="admin" requiredMenu="analytics">
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute audience="admin" requiredMenu="settings">
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings/storage-payment"
          element={
            <ProtectedRoute audience="admin" requiredMenu="settings">
              <StorageCheckoutResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/areas"
          element={
            <ProtectedRoute audience="admin" requiredMenu="areas">
              <AdminAreasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/prompts"
          element={
            <ProtectedRoute audience="admin" requiredMenu="prompts">
              <AdminPromptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute audience="admin" requiredMenu="logs">
              <AdminLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute audience="admin" requiredMenu="attendance">
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;



import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./features/landing/landing-page";
import { LoginPage } from "./features/auth/login-page";
import { RegisterPage } from "./features/auth/register-page";
import { OtpLoginPage } from "./features/auth/otp-login-page";
import { ForgotPasswordPage } from "./features/auth/forgot-password-page";
import { ResetPasswordPage } from "./features/auth/reset-password-page";
import { GoogleCallbackPage } from "./features/auth/google-callback-page";
import { DashboardPage } from "./features/dashboard/dashboard-page";
import { HomeReadinessQuizPage } from "./features/quiz/home-readiness-quiz-page";
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
import { ProtectedRoute } from "./components/protected-route";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/otp" element={<OtpLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/google/success" element={<GoogleCallbackPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/home-readiness"
        element={
          <ProtectedRoute>
            <HomeReadinessQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/home-readiness/result"
        element={
          <ProtectedRoute>
            <HomeReadinessResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/area"
        element={
          <ProtectedRoute>
            <AreaQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/area/result"
        element={
          <ProtectedRoute>
            <AreaQuizResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/recommended"
        element={
          <ProtectedRoute>
            <RecommendedPropertiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id"
        element={
          <ProtectedRoute>
            <PropertyDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calculators/budget/:propertyId"
        element={
          <ProtectedRoute>
            <BudgetCalculatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calculators/hidden-cost/:propertyId"
        element={
          <ProtectedRoute>
            <HiddenCostCalculatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calculators/roi/:propertyId"
        element={
          <ProtectedRoute>
            <RoiCalculatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspections/book"
        element={
          <ProtectedRoute>
            <InspectionBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role="admin">
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/properties"
        element={
          <ProtectedRoute role="admin">
            <AdminPropertiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inspections"
        element={
          <ProtectedRoute role="admin">
            <AdminInspectionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/crm"
        element={
          <ProtectedRoute role="admin">
            <AdminCrmPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/email-campaigns"
        element={
          <ProtectedRoute role="admin">
            <AdminEmailCampaignsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute role="admin">
            <AdminAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/areas"
        element={
          <ProtectedRoute role="admin">
            <AdminAreasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/prompts"
        element={
          <ProtectedRoute role="admin">
            <AdminPromptsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute role="admin">
            <AdminLogsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App



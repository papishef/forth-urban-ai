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
    </Routes>
  );
}

export default App



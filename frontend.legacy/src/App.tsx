import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Skeleton } from "./components/ui/skeleton";
import { useAuthStore } from "./store/useAuthStore";

// Lazy-load feature pages
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const OverviewPage = lazy(() => import("./pages/OverviewPage").then(m => ({ default: m.OverviewPage })));
const CasesPage = lazy(() => import("./pages/CasesPage").then(m => ({ default: m.CasesPage })));
const NetworkPage = lazy(() => import("./pages/NetworkPage").then(m => ({ default: m.NetworkPage })));
const GisPage = lazy(() => import("./pages/GisPage").then(m => ({ default: m.GisPage })));
const CopilotPage = lazy(() => import("./pages/CopilotPage").then(m => ({ default: m.CopilotPage })));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

function RouteLoadingFallback() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      <Skeleton className="h-14 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

// Protected Route Guard
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <LoginPage />
            </Suspense>
          }
        />

        {/* Protected Application Shell */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route
            path="/overview"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <OverviewPage />
              </Suspense>
            }
          />
          <Route
            path="/cases"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <CasesPage />
              </Suspense>
            }
          />
          <Route
            path="/network"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <NetworkPage />
              </Suspense>
            }
          />
          <Route
            path="/gis"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <GisPage />
              </Suspense>
            }
          />
          <Route
            path="/copilot"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <CopilotPage />
              </Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path="/reports"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route path="/theme" element={<Navigate to="/settings" replace />} />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />

          {/* Legacy & alias paths */}
          <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
          <Route path="/app/dashboard" element={<Navigate to="/overview" replace />} />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

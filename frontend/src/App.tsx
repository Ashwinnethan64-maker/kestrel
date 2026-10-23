import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { CasesPage } from "./pages/CasesPage";
import { NetworkPage } from "./pages/NetworkPage";
import { GisPage } from "./pages/GisPage";
import { CopilotPage } from "./pages/CopilotPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ThemeStudioPage } from "./pages/ThemeStudioPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/gis" element={<GisPage />} />
          <Route path="/copilot" element={<CopilotPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/theme" element={<ThemeStudioPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Fallback alias paths */}
          <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
          <Route path="/app/dashboard" element={<Navigate to="/overview" replace />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

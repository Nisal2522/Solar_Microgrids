// -----------------------------------------------------------------------------
// File: App.jsx
// Purpose: Application root — auth provider, toast provider, router, and the
//          route table. Authenticated routes render inside AppShell; the login
//          screen renders standalone.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UsersPage from "./pages/backoffice/UsersPage";
import PendingActivationsPage from "./pages/backoffice/PendingActivationsPage";
import StationsPage from "./pages/backoffice/StationsPage";
import ReservationsPage from "./pages/backoffice/ReservationsPage";
import OperatorDashboardPage from "./pages/operator/OperatorDashboardPage";

// Wraps a page in the auth guard and the application shell.
function Shell({ roles, children }) {
  return (
    <ProtectedRoute allowedRoles={roles}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

const BACKOFFICE = ["Backoffice"];
const STAFF = ["Backoffice", "GridOperator"];

// Application root: providers + router.
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Shell roles={STAFF}><HomePage /></Shell>} />
            <Route path="/backoffice/users" element={<Shell roles={BACKOFFICE}><UsersPage /></Shell>} />
            <Route path="/backoffice/pending" element={<Shell roles={BACKOFFICE}><PendingActivationsPage /></Shell>} />
            <Route path="/backoffice/stations" element={<Shell roles={BACKOFFICE}><StationsPage /></Shell>} />
            <Route path="/backoffice/reservations" element={<Shell roles={BACKOFFICE}><ReservationsPage /></Shell>} />
            <Route path="/operator" element={<Shell roles={STAFF}><OperatorDashboardPage /></Shell>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

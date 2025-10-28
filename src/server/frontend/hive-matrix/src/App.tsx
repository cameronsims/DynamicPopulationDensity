import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./auth/AuthCallback";
import AppLayout from "./Shell";
import Dashboard from "./pages/Dashboard";
import NodesPage from "./pages/NodesPage";


export default function App() {
  return (
    <Routes>
      {/* UNPROTECTED */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* PROTECTED */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nodes" element={<NodesPage />} />

          {/* add other protected pages here */}
        </Route>
      </Route>


      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

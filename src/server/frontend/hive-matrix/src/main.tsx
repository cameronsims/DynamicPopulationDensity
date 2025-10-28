
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./tw.css";
import { AuthProvider } from "./auth/useAuth";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/AppLayout";
import DataVisualsPage from "./pages/DataVisuals";
import LocationPage from "./pages/LocationPage";
import NodesPage from "./pages/Nodes";
import "./theme.css"


const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/location", element: <LocationPage /> },
          { path: "/nodes", element: <NodesPage /> },
          { path: "/data-visuals", element: <DataVisualsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>

);


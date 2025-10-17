import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./tw.css";
import { AuthProvider } from "./auth/useAuth";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/AppLayout";
import DataPage from "./pages/Data";
import ProjectDetailsPage from "./pages/ProjectDetails";
import DataVisualsPage from "./pages/DataVisuals";
import TeamPage from "./pages/Team";
import SavedPage from "./pages/Saved";
import DraftPage from "./pages/Draft";
import TrashPage from "./pages/Trash";

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
          { path: "/data", element: <DataPage /> },
          { path: "/project-details", element: <ProjectDetailsPage /> },
          { path: "/data-visuals", element: <DataVisualsPage /> },
          { path: "/team", element: <TeamPage /> },
          { path: "/saved", element: <SavedPage /> },
          { path: "/draft", element: <DraftPage /> },
          { path: "/trash", element: <TrashPage /> },
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

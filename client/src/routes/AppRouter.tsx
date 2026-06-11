import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";
import ProfessionalDashboard from "@/pages/dashboards/ProfessionalDashboard";
import CompanyDashboard from "@/pages/dashboards/CompanyDashboard";
import CoordinatorDashboard from "@/pages/dashboards/CoordinatorDashboard";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";

const AppRouter = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />

    {/* Protected role routes */}
    <Route
      path="/student/*"
      element={
        <ProtectedRoute allowedRole="STUDENT">
          <StudentDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/professional/*"
      element={
        <ProtectedRoute allowedRole="PROFESSIONAL">
          <ProfessionalDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/company/*"
      element={
        <ProtectedRoute allowedRole="COMPANY">
          <CompanyDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/coordinator/*"
      element={
        <ProtectedRoute allowedRole="COORDINATOR">
          <CoordinatorDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/*"
      element={
        <ProtectedRoute allowedRole="ADMIN">
          <AdminDashboard />
        </ProtectedRoute>
      }
    />

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRouter;

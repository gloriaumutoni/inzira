import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import NotFound from '@/pages/NotFound'
import StudentDashboard from '@/pages/dashboards/StudentDashboard'
import ProfessionalDashboard from '@/pages/dashboards/ProfessionalDashboard'
import CareerGuideDashboard from '@/pages/dashboards/CareerGuideDashboard'
import AdminDashboard from '@/pages/dashboards/AdminDashboard'

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

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
      path="/career-guide/*"
      element={
        <ProtectedRoute allowedRole="CAREER_GUIDE">
          <CareerGuideDashboard />
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

    <Route path="*" element={<NotFound />} />
  </Routes>
)

export default AppRouter

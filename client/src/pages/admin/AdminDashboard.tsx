import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminVerification from '@/pages/admin/AdminVerification'
import AdminCreateSlots from '@/pages/admin/AdminCreateSlots'
import AdminSchools from '@/pages/admin/AdminSchools'
import AdminReports from '@/pages/admin/AdminReports'
import AdminCareerStories from '@/pages/admin/AdminCareerStories'
import AdminSessionReports from '@/pages/admin/AdminSessionReports'

const AdminDashboard = () => (
  <DashboardLayout role="ADMIN">
    <Routes>
      <Route index element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<AdminOverview />} />
      <Route path="verification" element={<AdminVerification />} />
      <Route path="create-slots" element={<AdminCreateSlots />} />
      <Route path="schools" element={<AdminSchools />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="career-stories" element={<AdminCareerStories />} />
      <Route path="session-reports" element={<AdminSessionReports />} />
    </Routes>
  </DashboardLayout>
)

export default AdminDashboard

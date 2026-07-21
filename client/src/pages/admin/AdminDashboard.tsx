import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminVerification from '@/pages/admin/AdminVerification'
import AdminCreateSlots from '@/pages/admin/AdminCreateSlots'
import AdminSchools from '@/pages/admin/AdminSchools'
import AdminReports from '@/pages/admin/AdminReports'
import AdminCareerStories from '@/pages/admin/AdminCareerStories'
import AdminSessionReports from '@/pages/admin/AdminSessionReports'
import AdminCareers from '@/pages/admin/AdminCareers'
import AdminImpact from '@/pages/admin/AdminImpact'

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
      <Route path="careers" element={<AdminCareers />} />
      <Route path="impact" element={<AdminImpact />} />
    </Routes>
  </DashboardLayout>
)

export default AdminDashboard

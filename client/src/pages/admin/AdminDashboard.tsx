import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminVerification from '@/pages/admin/AdminVerification'
import AdminInterviewSlots from '@/pages/admin/AdminInterviewSlots'
import AdminSchools from '@/pages/admin/AdminSchools'
import AdminReports from '@/pages/admin/AdminReports'

const AdminDashboard = () => (
  <DashboardLayout role="ADMIN">
    <Routes>
      <Route index element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<AdminOverview />} />
      <Route path="verification" element={<AdminVerification />} />
      <Route path="interview-slots" element={<AdminInterviewSlots />} />
      <Route path="schools" element={<AdminSchools />} />
      <Route path="reports" element={<AdminReports />} />
    </Routes>
  </DashboardLayout>
)

export default AdminDashboard

import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminVerification from '@/pages/admin/AdminVerification'
import AdminSchools from '@/pages/admin/AdminSchools'

const AdminDashboard = () => (
  <DashboardLayout role="ADMIN">
    <Routes>
      <Route index element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<AdminOverview />} />
      <Route path="verification" element={<AdminVerification />} />
      <Route path="schools" element={<AdminSchools />} />
    </Routes>
  </DashboardLayout>
)

export default AdminDashboard

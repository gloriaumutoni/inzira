import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProfessionalHome from '@/pages/professional/ProfessionalHome'
import ProfessionalSessions from '@/pages/professional/ProfessionalSessions'
import ProfessionalMentees from '@/pages/professional/ProfessionalMentees'

const ProfessionalDashboard = () => (
  <DashboardLayout role="PROFESSIONAL">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<ProfessionalHome />} />
      <Route path="sessions" element={<ProfessionalSessions />} />
      <Route path="mentees" element={<ProfessionalMentees />} />
    </Routes>
  </DashboardLayout>
)

export default ProfessionalDashboard

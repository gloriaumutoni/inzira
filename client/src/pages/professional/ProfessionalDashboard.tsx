import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProfessionalHome from '@/pages/professional/ProfessionalHome'
import ProfessionalSessions from '@/pages/professional/ProfessionalSessions'
import ProfessionalMentees from '@/pages/professional/ProfessionalMentees'
import ProfessionalEarnings from '@/pages/professional/ProfessionalEarnings'

const ProfessionalDashboard = () => (
  <DashboardLayout role="PROFESSIONAL">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<ProfessionalHome />} />
      <Route path="sessions" element={<ProfessionalSessions />} />
      <Route path="mentees" element={<ProfessionalMentees />} />
      <Route path="earnings" element={<ProfessionalEarnings />} />
    </Routes>
  </DashboardLayout>
)

export default ProfessionalDashboard

import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProfessionalHome from '@/pages/professional/ProfessionalHome'
import ProfessionalSessions from '@/pages/professional/ProfessionalSessions'
import ProfessionalMentees from '@/pages/professional/ProfessionalMentees'
import ProfessionalEarnings from '@/pages/professional/ProfessionalEarnings'
import ProfessionalCreateSlots from '@/pages/professional/ProfessionalCreateSlots'
import ProfessionalCareerStories from '@/pages/professional/ProfessionalCareerStories'

const ProfessionalDashboard = () => (
  <DashboardLayout role="PROFESSIONAL">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<ProfessionalHome />} />
      <Route path="sessions" element={<ProfessionalSessions />} />
      <Route path="mentees" element={<ProfessionalMentees />} />
      <Route path="earnings" element={<ProfessionalEarnings />} />
      <Route path="create-slots" element={<ProfessionalCreateSlots />} />
      <Route path="career-stories" element={<ProfessionalCareerStories />} />
    </Routes>
  </DashboardLayout>
)

export default ProfessionalDashboard

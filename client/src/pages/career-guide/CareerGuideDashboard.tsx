import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CareerGuideHome from '@/pages/career-guide/CareerGuideHome'
import CareerGuideSessions from '@/pages/career-guide/CareerGuideSessions'
import CohortQuiz from '@/pages/career-guide/CohortQuiz'
import CohortImpact from '@/pages/career-guide/CohortImpact'

const CareerGuideDashboard = () => (
  <DashboardLayout role="CAREER_GUIDE">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<CareerGuideHome />} />
      <Route path="sessions" element={<CareerGuideSessions />} />
      <Route path="cohort-quiz" element={<CohortQuiz />} />
      <Route path="impact" element={<CohortImpact />} />
    </Routes>
  </DashboardLayout>
)

export default CareerGuideDashboard

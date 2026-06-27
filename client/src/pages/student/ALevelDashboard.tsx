import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ALevelHome from '@/pages/student/ALevelHome'
import ALevelExploreCareers from '@/pages/student/ALevelExploreCareers'
import ALevelWorkshops from '@/pages/student/ALevelWorkshops'
import ALevelSessions from '@/pages/student/ALevelSessions'
import ALevelGetMentor from '@/pages/student/ALevelGetMentor'

const ALevelDashboard = () => (
  <DashboardLayout role="STUDENT" level="A_LEVEL">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<ALevelHome />} />
      <Route path="explore-careers" element={<ALevelExploreCareers />} />
      <Route path="workshops" element={<ALevelWorkshops />} />
      <Route path="sessions" element={<ALevelSessions />} />
      <Route path="get-mentor" element={<ALevelGetMentor />} />
    </Routes>
  </DashboardLayout>
)

export default ALevelDashboard

import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ALevelHome from '@/pages/student/ALevelHome'
import ALevelSessions from '@/pages/student/ALevelSessions'
import StudentGetMentor from '@/pages/student/StudentGetMentor'
import CareerLibrary from '@/pages/student/CareerLibrary'

const ALevelDashboard = () => (
  <DashboardLayout role="STUDENT" level="A_LEVEL">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<ALevelHome />} />
      <Route path="sessions" element={<ALevelSessions />} />
      <Route path="get-mentor" element={<StudentGetMentor />} />
      <Route path="career-library" element={<CareerLibrary />} />
    </Routes>
  </DashboardLayout>
)

export default ALevelDashboard

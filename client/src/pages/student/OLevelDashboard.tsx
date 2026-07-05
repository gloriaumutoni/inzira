import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StudentHome from '@/pages/student/StudentHome'
import StudentSessions from '@/pages/student/StudentSessions'
import StudentGetMentor from '@/pages/student/StudentGetMentor'
import CombinationQuiz from '@/pages/student/CombinationQuiz'
import CareerLibrary from '@/pages/student/CareerLibrary'

const OLevelDashboard = () => (
  <DashboardLayout role="STUDENT" level="O_LEVEL">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<StudentHome />} />
      <Route path="sessions" element={<StudentSessions />} />
      <Route path="get-mentor" element={<StudentGetMentor />} />
      <Route path="quiz" element={<CombinationQuiz />} />
      <Route path="career-library" element={<CareerLibrary />} />
    </Routes>
  </DashboardLayout>
)

export default OLevelDashboard

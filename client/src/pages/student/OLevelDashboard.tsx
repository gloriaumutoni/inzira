import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StudentHome from '@/pages/student/StudentHome'
import StudentSessions from '@/pages/student/StudentSessions'
import StudentGetMentor from '@/pages/student/StudentGetMentor'
import PathwayQuiz from '@/pages/student/PathwayQuiz'
import CareerLibrary from '@/pages/student/CareerLibrary'
import PathwayCompare from '@/pages/student/PathwayCompare'

const OLevelDashboard = () => (
  <DashboardLayout role="STUDENT" level="O_LEVEL">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<StudentHome />} />
      <Route path="sessions" element={<StudentSessions />} />
      <Route path="get-mentor" element={<StudentGetMentor />} />
      <Route path="quiz" element={<PathwayQuiz />} />
      <Route path="career-library" element={<CareerLibrary />} />
      <Route path="compare" element={<PathwayCompare />} />
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  </DashboardLayout>
)

export default OLevelDashboard

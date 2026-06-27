import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StudentHome from '@/pages/student/StudentHome'
import StudentDiscover from '@/pages/student/StudentDiscover'
import StudentSessions from '@/pages/student/StudentSessions'
import StudentGetMentor from '@/pages/student/StudentGetMentor'

const StudentDashboard = () => (
  <DashboardLayout role="STUDENT">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<StudentHome />} />
      <Route path="discover" element={<StudentDiscover />} />
      <Route path="sessions" element={<StudentSessions />} />
      <Route path="get-mentor" element={<StudentGetMentor />} />
    </Routes>
  </DashboardLayout>
)

export default StudentDashboard

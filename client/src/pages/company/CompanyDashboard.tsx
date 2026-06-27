import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CompanyHome from '@/pages/company/CompanyHome'
import CompanyWorkshops from '@/pages/company/CompanyWorkshops'
import CompanyInsights from '@/pages/company/CompanyInsights'

const CompanyDashboard = () => (
  <DashboardLayout role="COMPANY">
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<CompanyHome />} />
      <Route path="workshops" element={<CompanyWorkshops />} />
      <Route path="insights" element={<CompanyInsights />} />
    </Routes>
  </DashboardLayout>
)

export default CompanyDashboard

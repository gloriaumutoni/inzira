import PageWrapper from "@/components/layout/PageWrapper";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const CompanyDashboard = () => (
  <div>
    <Navbar />
    <PageWrapper>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-primary">Company Dashboard</h1>
        <Badge label="COMPANY" variant="COMPANY" />
      </div>
      <Card className="p-6">
        <p className="text-text-secondary">Sprint 2 content coming soon.</p>
      </Card>
    </PageWrapper>
  </div>
);

export default CompanyDashboard;

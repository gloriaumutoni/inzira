import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/index";
import { Role } from "@/types/index";

const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student",
  PROFESSIONAL: "/professional",
  COMPANY: "/company",
  COORDINATOR: "/coordinator",
  ADMIN: "/admin",
};

interface Props {
  children: React.ReactNode;
  allowedRole?: Role;
}

const ProtectedRoute = ({ children, allowedRole }: Props) => {
  const { isLoaded, isSignedIn, role } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && role && role !== allowedRole) {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

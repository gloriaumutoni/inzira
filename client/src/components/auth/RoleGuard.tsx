import useRole from "@/hooks/useRole";
import { Role } from "@/types/index";

interface Props {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleGuard = ({ allowedRoles, children, fallback = null }: Props) => {
  const { role } = useRole();

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGuard;

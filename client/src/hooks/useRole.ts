import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/index";

interface UseRoleReturn {
  role: Role | null;
  isStudent: boolean;
  isProfessional: boolean;
  isCompany: boolean;
  isCareerGuide: boolean;
  isAdmin: boolean;
}

const useRole = (): UseRoleReturn => {
  const { role } = useAuth();
  return {
    role,
    isStudent: role === "STUDENT",
    isProfessional: role === "PROFESSIONAL",
    isCompany: role === "COMPANY",
    isCareerGuide: role === "CAREER_GUIDE",
    isAdmin: role === "ADMIN",
  };
};

export default useRole;

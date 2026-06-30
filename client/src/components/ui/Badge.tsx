import { Role } from "@/types/index";

type BadgeVariant = Role | "success" | "warning" | "error" | "info" | "default";

interface Props {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  STUDENT: "bg-blue-100 text-blue-800",
  PROFESSIONAL: "bg-teal-100 text-teal-800",
  CAREER_GUIDE: "bg-orange-100 text-orange-800",
  ADMIN: "bg-red-100 text-red-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  default: "bg-gray-100 text-gray-700",
};

const Badge = ({ label, variant = "default", className = "" }: Props) => (
  <span
    className={`
      inline-flex items-center rounded-full px-2.5 py-0.5
      text-xs font-medium
      ${variantClasses[variant]}
      ${className}
    `}
  >
    {label}
  </span>
);

export default Badge;

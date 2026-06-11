import Spinner from "./Spinner";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-border text-primary bg-surface hover:bg-background disabled:opacity-50",
  ghost: "text-text-secondary hover:text-primary disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
}: Props) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2
      rounded-button font-medium transition-all
      focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}
  >
    {loading && <Spinner size="sm" />}
    {children}
  </button>
);

export default Button;

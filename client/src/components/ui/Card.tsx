interface Props {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: Props) => (
  <div
    className={`bg-surface rounded-card shadow-card border border-border ${className}`}
  >
    {children}
  </div>
);

export default Card;

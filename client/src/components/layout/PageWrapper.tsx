interface Props {
  children: React.ReactNode;
  className?: string;
}

const PageWrapper = ({ children, className = "" }: Props) => (
  <div className={`min-h-screen bg-background ${className}`}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  </div>
);

export default PageWrapper;

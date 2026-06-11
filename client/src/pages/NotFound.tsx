import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

const NotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <p className="text-8xl font-bold text-accent mb-4">404</p>
      <h1 className="text-2xl font-bold text-primary mb-2">Page not found</h1>
      <p className="text-text-secondary mb-8 text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary">Go home</Button>
      </Link>
    </div>
  </div>
);

export default NotFound;

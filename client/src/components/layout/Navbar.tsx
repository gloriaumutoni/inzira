import { Link } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import useRole from "@/hooks/useRole";
import useUser from "@/hooks/useUser";
import Button from "@/components/ui/Button";
import { Role } from "@/types/index";

interface NavLink {
  label: string;
  to: string;
}

const ROLE_LINKS: Record<Role, NavLink[]> = {
  STUDENT: [
    { label: "Careers", to: "/student/careers" },
    { label: "My Sessions", to: "/student/sessions" },
    { label: "Workshops", to: "/student/workshops" },
  ],
  PROFESSIONAL: [
    { label: "My Profile", to: "/professional/profile" },
    { label: "Sessions", to: "/professional/sessions" },
  ],
  COMPANY: [
    { label: "Workshops", to: "/company/workshops" },
    { label: "Analytics", to: "/company/analytics" },
  ],
  COORDINATOR: [{ label: "Dashboard", to: "/coordinator" }],
  ADMIN: [
    { label: "Users", to: "/admin/users" },
    { label: "Platform", to: "/admin/platform" },
  ],
};

const Navbar = () => {
  const { isSignedIn } = useAuth();
  const { role } = useRole();
  const { displayName, avatarUrl, signOut } = useUser();
  const { sidebarOpen, setSidebarOpen } = useUI();

  const links = role ? ROLE_LINKS[role] : [];

  return (
    <>
      <nav className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="text-xl font-bold text-primary tracking-tight"
            >
              Inzira
            </Link>

            {/* Desktop centre links */}
            {links.length > 0 && (
              <div className="hidden md:flex items-center gap-6">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Desktop right: auth */}
            <div className="hidden md:flex items-center gap-3">
              {isSignedIn ? (
                <>
                  <div className="flex items-center gap-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-primary">
                      {displayName}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-button text-text-secondary hover:text-primary hover:bg-background transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-72 bg-surface shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-border">
              <Link
                to="/"
                className="text-xl font-bold text-primary"
                onClick={() => setSidebarOpen(false)}
              >
                Inzira
              </Link>
              <button
                className="p-2 rounded-button text-text-secondary hover:text-primary"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-4 flex-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-primary hover:bg-background transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              {isSignedIn ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-primary">
                      {displayName}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      signOut();
                      setSidebarOpen(false);
                    }}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setSidebarOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/login" onClick={() => setSidebarOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

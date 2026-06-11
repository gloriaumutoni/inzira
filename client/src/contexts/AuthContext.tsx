import { createContext, useContext } from "react";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { Role } from "@/types/index";

type ClerkUser = NonNullable<ReturnType<typeof useClerkUser>["user"]>;

interface AuthContextType {
  user: ClerkUser | null;
  role: Role | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useClerkUser();

  const role = (user?.publicMetadata?.role as Role | undefined) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        role,
        isLoaded,
        isSignedIn: isSignedIn ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

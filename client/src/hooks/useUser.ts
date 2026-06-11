import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";

const useUser = () => {
  const { user } = useAuth();
  const { signOut } = useClerk();

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "";

  const avatarUrl = user?.imageUrl ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  return { displayName, avatarUrl, email, signOut };
};

export default useUser;

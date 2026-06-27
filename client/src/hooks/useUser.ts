const useUser = () => {
  return {
    displayName: "",
    avatarUrl: null as string | null,
    email: null as string | null,
    signOut: () => {},
  };
};

export default useUser;

import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { UIProvider } from "@/contexts/UIContext";
import AppRouter from "@/routes/AppRouter";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "VITE_CLERK_PUBLISHABLE_KEY is not set in environment variables",
  );
}

const App = () => (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <AuthProvider>
      <UIProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </UIProvider>
    </AuthProvider>
  </ClerkProvider>
);

export default App;

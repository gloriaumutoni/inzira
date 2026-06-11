import { SignIn } from "@clerk/clerk-react";

const Login = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Inzira</h1>
        <p className="text-text-secondary mt-2 text-sm">
          Sign in to continue your career journey
        </p>
      </div>
      <SignIn routing="hash" signUpUrl="/login" afterSignInUrl="/student" />
    </div>
  </div>
);

export default Login;

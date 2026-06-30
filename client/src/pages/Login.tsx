import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { loginUser, getMe } from '@/api/auth.api'
import { Role } from '@/types'

const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student/home',
  PROFESSIONAL: '/professional/home',
  CAREER_GUIDE: '/career-guide/home',
  ADMIN: '/admin/overview',
}

const Login = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { accessToken } = await loginUser(email, password)
      const me = await getMe()
      setAuth(accessToken, me)
      navigate(ROLE_HOME[me.role])
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-card p-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary hover:text-accent transition-colors">Inzira</Link>
          <h2 className="text-xl font-semibold text-primary mt-4">
            Welcome back
          </h2>
          <p className="text-muted text-sm mt-1">
            Sign in to your Inzira account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your username or email"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="text-right mt-1">
              <button
                type="button"
                onClick={() => alert('Coming soon')}
                className="text-xs text-accent hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {error && (
            <p className="text-error text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

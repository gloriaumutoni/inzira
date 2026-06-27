import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Home, Compass, Calendar, Users, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type Role = 'STUDENT' | 'PROFESSIONAL' | 'COMPANY' | 'CAREER_GUIDE' | 'ADMIN'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
}

const STUDENT_NAV: NavItem[] = [
  { label: 'Home',       icon: Home,    path: '/student/home' },
  { label: 'Discover',   icon: Compass, path: '/student/discover' },
  { label: 'Sessions',   icon: Calendar,path: '/student/sessions' },
  { label: 'Get Mentor', icon: Users,   path: '/student/get-mentor' },
]

const NAV_MAP: Record<Role, NavItem[]> = {
  STUDENT:      STUDENT_NAV,
  PROFESSIONAL: [],
  COMPANY:      [],
  CAREER_GUIDE: [],
  ADMIN:        [],
}

const PAGE_TITLES: Record<string, string> = {
  '/student/home':        'Home',
  '/student/discover':    'Discover',
  '/student/sessions':    'Sessions',
  '/student/get-mentor':  'Get a Mentor',
}

function getInitials(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return '?'
  const p = user.student ?? user.professional ?? user.careerGuide ?? null
  if (p && 'firstName' in p && 'lastName' in p) {
    return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase()
  }
  if (user.company) return user.company.companyName[0]?.toUpperCase() ?? 'C'
  return user.email[0]?.toUpperCase() ?? '?'
}

function getDisplayName(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return ''
  const p = user.student ?? user.professional ?? user.careerGuide ?? null
  if (p && 'firstName' in p) return `${p.firstName} ${('lastName' in p ? p.lastName : '')}`.trim()
  if (user.company) return user.company.companyName
  return user.email
}

interface DashboardLayoutProps {
  role: Role
  children: React.ReactNode
}

const DashboardLayout = ({ role, children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = NAV_MAP[role]
  const pageTitle = PAGE_TITLES[location.pathname] ?? ''

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-primary flex-shrink-0">
        <div className="px-6 py-5">
          <span className="text-white font-bold text-lg">Inzira</span>
        </div>

        <nav className="flex-1 mt-2">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={[
                  'flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent/20 text-white border-r-2 border-accent'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                ].join(' ')}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 text-sm text-white/60 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <span className="text-sm font-semibold text-primary">{pageTitle}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted hidden sm:block">{getDisplayName(user)}</span>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {getInitials(user)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

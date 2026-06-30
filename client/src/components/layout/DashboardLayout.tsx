import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Home, Compass, Calendar, Users, LogOut, CheckCircle, ShieldCheck, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { logoutUser } from '@/api/auth.api'

type Role = 'STUDENT' | 'PROFESSIONAL' | 'CAREER_GUIDE' | 'ADMIN'
type Level = 'O_LEVEL' | 'A_LEVEL'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
}

const STUDENT_O_LEVEL_NAV: NavItem[] = [
  { label: 'Home',       icon: Home,     path: '/student/home' },
  { label: 'Discover',   icon: Compass,  path: '/student/discover' },
  { label: 'Sessions',   icon: Calendar, path: '/student/sessions' },
  { label: 'Get Mentor', icon: Users,    path: '/student/get-mentor' },
]

const PROFESSIONAL_NAV: NavItem[] = [
  { label: 'Home',     icon: Home,        path: '/professional/home' },
  { label: 'Sessions', icon: Calendar,    path: '/professional/sessions' },
  { label: 'Mentees',  icon: Users,       path: '/professional/mentees' },
]

const CAREER_GUIDE_NAV: NavItem[] = [
  { label: 'Home',     icon: Home,     path: '/career-guide/home' },
  { label: 'Sessions', icon: Calendar, path: '/career-guide/sessions' },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Verification', icon: ShieldCheck, path: '/admin/verification' },
]

const STUDENT_A_LEVEL_NAV: NavItem[] = [
  { label: 'Home',            icon: Home,     path: '/student/home' },
  { label: 'Explore Careers', icon: Compass,  path: '/student/explore-careers' },
  { label: 'Sessions',        icon: Calendar, path: '/student/sessions' },
  { label: 'Get Mentor',      icon: Users,    path: '/student/get-mentor' },
]

const PAGE_TITLES: Record<string, string> = {
  '/student/home':              'Home',
  '/student/discover':          'Discover',
  '/student/explore-careers':   'Explore Careers',
  '/student/workshops':         'Workshops',
  '/student/sessions':          'Sessions',
  '/student/get-mentor':        'Get a Mentor',
  '/professional/home':         'Home',
  '/professional/sessions':     'Sessions',
  '/professional/mentees':      'Mentees',
  '/career-guide/home':         'Home',
  '/career-guide/workshops':    'Workshops',
  '/career-guide/sessions':     'Career Discovery',
  '/admin/overview':            'Overview',
  '/admin/verification':        'Verification',
  '/admin/schools':             'Partner Schools',
}

function getNavItems(role: Role, level?: Level): NavItem[] {
  if (role === 'STUDENT') {
    return level === 'A_LEVEL' ? STUDENT_A_LEVEL_NAV : STUDENT_O_LEVEL_NAV
  }
  if (role === 'PROFESSIONAL') return PROFESSIONAL_NAV
  if (role === 'CAREER_GUIDE') return CAREER_GUIDE_NAV
  if (role === 'ADMIN') return ADMIN_NAV
  return []
}

function getInitials(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return '?'
  const p = user.student ?? user.professional ?? user.careerGuide ?? null
  if (p && 'firstName' in p && 'lastName' in p) {
    return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase()
  }
  return user.email[0]?.toUpperCase() ?? '?'
}

function getDisplayName(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return ''
  const p = user.student ?? user.professional ?? user.careerGuide ?? null
  if (p && 'firstName' in p) return `${p.firstName} ${'lastName' in p ? p.lastName : ''}`.trim()
  return user.email
}

interface DashboardLayoutProps {
  role: Role
  level?: Level
  children: React.ReactNode
}

const SidebarContent = ({
  navItems,
  pathname,
  onNavClick,
  onLogout,
  role,
  isVerified,
  isMentor,
}: {
  navItems: NavItem[]
  pathname: string
  onNavClick?: () => void
  onLogout: () => void
  role: Role
  isVerified: boolean
  isMentor: boolean
}) => (
  <>
    <div className="px-6 py-5">
      <span className="text-white font-bold text-lg">Inzira</span>
    </div>

    <nav className="flex-1 mt-2">
      {navItems.map(({ label, icon: Icon, path }) => {
        const isLocked =
          role === 'PROFESSIONAL' &&
          (!isVerified || !isMentor) &&
          (label === 'Sessions' || label === 'Mentees')

        if (isLocked) {
          return (
            <div
              key={path}
              className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-white/30 cursor-not-allowed select-none"
              title={
                !isVerified
                  ? 'Available once your account is verified'
                  : 'Available once your mentor application is approved'
              }
            >
              <Icon size={16} />
              {label}
            </div>
          )
        }

        const active = pathname === path
        return (
          <Link
            key={path}
            to={path}
            onClick={onNavClick}
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
      onClick={onLogout}
      className="flex items-center gap-3 px-6 py-4 text-sm text-white/60 hover:text-white transition-colors"
    >
      <LogOut size={16} />
      Logout
    </button>
  </>
)

const DashboardLayout = ({ role, level, children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = getNavItems(role, level)
  const pageTitle = PAGE_TITLES[location.pathname] ?? ''

  const handleLogout = async () => {
    try { await logoutUser() } catch { /* ignore network errors */ }
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-primary flex-shrink-0">
        <SidebarContent
          navItems={navItems}
          pathname={location.pathname}
          onLogout={handleLogout}
          role={role}
          isVerified={user?.professional?.isVerified === true}
          isMentor={user?.professional?.isMentor === true}
        />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex flex-col w-56 bg-primary flex-shrink-0">
            <div className="flex items-center justify-between px-6 py-5">
              <span className="text-white font-bold text-lg">Inzira</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 mt-2">
              {navItems.map(({ label, icon: Icon, path }) => {
                const isLocked =
                  role === 'PROFESSIONAL' &&
                  (user?.professional?.isVerified !== true || user?.professional?.isMentor !== true) &&
                  (label === 'Sessions' || label === 'Mentees')

                if (isLocked) {
                  return (
                    <div
                      key={path}
                      className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-white/30 cursor-not-allowed select-none"
                      title={
                        user?.professional?.isVerified !== true
                          ? 'Available once your account is verified'
                          : 'Available once your mentor application is approved'
                      }
                    >
                      <Icon size={16} />
                      {label}
                    </div>
                  )
                }

                const active = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
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
          </div>
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-muted hover:text-primary transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-primary">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm text-muted">{getDisplayName(user)}</span>
              {role === 'PROFESSIONAL' && user?.professional?.isVerified === true && (
                <span className="bg-success/10 text-success text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                  <CheckCircle size={10} />
                  Verified Mentor
                </span>
              )}
              {role === 'CAREER_GUIDE' && (
                <span className="text-xs text-muted mt-0.5">Career Discovery</span>
              )}
              {role === 'ADMIN' && (
                <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5">
                  Administrator
                </span>
              )}
            </div>
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

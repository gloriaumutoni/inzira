import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Home, Calendar, Users, LogOut, LayoutDashboard, ShieldCheck, Building2, CalendarPlus, Lock, BarChart2, BookOpen, Flag } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { logoutUser } from '@/api/auth.api'

type Role = 'STUDENT' | 'PROFESSIONAL' | 'CAREER_GUIDE' | 'ADMIN'
type Level = 'O_LEVEL' | 'A_LEVEL'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  disabled?: boolean
}

const STUDENT_O_LEVEL_NAV: NavItem[] = [
  { label: 'Home',       icon: Home,     path: '/student/home' },
  { label: 'Sessions',   icon: Calendar, path: '/student/sessions' },
  { label: 'Get Mentor', icon: Users,    path: '/student/get-mentor' },
]

const PROFESSIONAL_NAV_BASE: NavItem[] = [
  { label: 'Home',          icon: Home,     path: '/professional/home' },
  { label: 'Sessions',      icon: Calendar, path: '/professional/sessions' },
]

const MENTOR_NAV: NavItem[] = [
  { label: 'Home',         icon: Home,         path: '/professional/home' },
  { label: 'Sessions',     icon: Calendar,     path: '/professional/sessions' },
  { label: 'Create Slots', icon: CalendarPlus, path: '/professional/create-slots' },
]

const UNDER_REVIEW_NAV: NavItem[] = [
  { label: 'Home',         icon: Home,         path: '/professional/home' },
  { label: 'Sessions',     icon: Calendar,     path: '/professional/sessions',     disabled: true },
  { label: 'Create Slots', icon: CalendarPlus, path: '/professional/create-slots', disabled: true },
]

const CAREER_GUIDE_NAV: NavItem[] = [
  { label: 'Home',     icon: Home,     path: '/career-guide/home' },
  { label: 'Sessions', icon: Calendar, path: '/career-guide/sessions' },
]

const CAREER_GUIDE_UNDER_REVIEW_NAV: NavItem[] = [
  { label: 'Home',     icon: Home,     path: '/career-guide/home' },
  { label: 'Sessions', icon: Calendar, path: '/career-guide/sessions', disabled: true },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Overview',         icon: LayoutDashboard, path: '/admin/overview' },
  { label: 'Verification',     icon: ShieldCheck,     path: '/admin/verification' },
  { label: 'Create Slots',     icon: CalendarPlus,    path: '/admin/create-slots' },
  { label: 'Schools',          icon: Building2,       path: '/admin/schools' },
  { label: 'Career Stories',   icon: BookOpen,        path: '/admin/career-stories' },
  { label: 'Safety',           icon: Flag,            path: '/admin/session-reports' },
  { label: 'Reports',          icon: BarChart2,       path: '/admin/reports' },
]

const STUDENT_A_LEVEL_NAV: NavItem[] = [
  { label: 'Home',                icon: Home,     path: '/student/home' },
  { label: 'Sessions',            icon: Calendar, path: '/student/sessions' },
  { label: 'Get Mentor',          icon: Users,    path: '/student/get-mentor' },
  { label: 'Career Library',      icon: BookOpen, path: '/student/career-library' },
]

const CAREER_STORY_NAV_ITEM: NavItem = { label: 'Career Stories', icon: BookOpen, path: '/professional/career-stories' }

const PAGE_TITLES: Record<string, string> = {
  '/student/home':                   'Home',
  '/student/discover':               'Discover',
  '/student/explore-careers':        'Explore Careers',
  '/student/sessions':               'Sessions',
  '/student/get-mentor':             'Get Mentor',
  '/student/career-library':         'Career Library',
  '/professional/home':              'Home',
  '/professional/sessions':          'Sessions',
  '/professional/earnings':          'Earnings',
  '/professional/career-stories':    'Career Stories',
  '/career-guide/home':              'Home',
  '/career-guide/sessions':          'Career Discovery',
  '/admin/overview':                 'Overview',
  '/admin/verification':             'Verification',
  '/admin/create-slots':             'Create Slots',
  '/admin/schools':                  'Partner Schools',
  '/admin/reports':                  'Reports',
  '/admin/career-stories':           'Career Stories Review',
  '/admin/session-reports':          'Safety — Session Reports',
}

function getNavItems(role: Role, level?: Level): NavItem[] {
  if (role === 'STUDENT') {
    return level === 'A_LEVEL' ? STUDENT_A_LEVEL_NAV : STUDENT_O_LEVEL_NAV
  }
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

const DashboardLayout = ({ role, level, children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const getProfessionalNav = (): NavItem[] => {
    if (!user?.professional?.isVerified) return [...UNDER_REVIEW_NAV, { ...CAREER_STORY_NAV_ITEM, disabled: true }]
    if (user?.professional?.isMentor) return [...MENTOR_NAV, CAREER_STORY_NAV_ITEM]
    return [...PROFESSIONAL_NAV_BASE, CAREER_STORY_NAV_ITEM]
  }

  const getCareerGuideNav = (): NavItem[] => {
    if (!user?.careerGuide?.isVerified) return CAREER_GUIDE_UNDER_REVIEW_NAV
    return CAREER_GUIDE_NAV
  }

  const navItems = role === 'PROFESSIONAL'
    ? getProfessionalNav()
    : role === 'CAREER_GUIDE'
      ? getCareerGuideNav()
      : getNavItems(role, level)
  const pageTitle = PAGE_TITLES[location.pathname] ?? ''

  const handleLogout = async () => {
    try { await logoutUser() } catch { /* ignore network errors */ }
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
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            if (item.disabled) {
              return (
                <div
                  key={item.path}
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-white/25 cursor-not-allowed select-none"
                  title="Available once your account is verified"
                >
                  <Icon size={16} className="opacity-40" />
                  <span>{item.label}</span>
                  <span className="ml-auto">
                    <Lock size={12} className="opacity-40" />
                  </span>
                </div>
              )
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={[
                  'flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent/20 text-white border-r-2 border-accent'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                ].join(' ')}
              >
                <Icon size={16} />
                {item.label}
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
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm text-muted">{getDisplayName(user)}</span>
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

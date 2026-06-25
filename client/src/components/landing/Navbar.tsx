import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-50 bg-surface shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-primary">Inzira</Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/explore" className="text-sm font-medium text-accent border-b-2 border-accent pb-0.5">Explore</Link>
          <Link to="/workshops" className="text-sm font-medium text-muted hover:text-primary transition-colors">Workshops</Link>
          <Link to="/sessions" className="text-sm font-medium text-muted hover:text-primary transition-colors">Sessions</Link>
        </div>

        <div className="hidden md:block">
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>

        <button
          className="md:hidden text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-border px-6 py-4 flex flex-col gap-4">
          <Link to="/explore" className="text-sm font-medium text-accent" onClick={() => setMobileOpen(false)}>Explore</Link>
          <Link to="/workshops" className="text-sm font-medium text-muted" onClick={() => setMobileOpen(false)}>Workshops</Link>
          <Link to="/sessions" className="text-sm font-medium text-muted" onClick={() => setMobileOpen(false)}>Sessions</Link>
          <button
            onClick={() => { navigate('/login'); setMobileOpen(false) }}
            className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full"
          >
            Sign In
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar

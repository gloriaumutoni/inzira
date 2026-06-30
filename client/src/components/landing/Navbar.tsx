import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-50 bg-surface shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-primary">Inzira</Link>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-primary px-4 py-2 rounded-lg border border-border hover:bg-background transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign Up
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
        <div className="md:hidden bg-surface border-t border-border px-6 py-4 flex flex-col gap-3">
          <button
            onClick={() => { navigate('/login'); setMobileOpen(false) }}
            className="text-sm font-medium text-primary px-4 py-2 rounded-lg border border-border w-full"
          >
            Sign In
          </button>
          <button
            onClick={() => { navigate('/signup'); setMobileOpen(false) }}
            className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full"
          >
            Sign Up
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar

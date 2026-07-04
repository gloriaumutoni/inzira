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

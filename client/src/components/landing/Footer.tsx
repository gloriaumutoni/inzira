import { Link } from 'react-router-dom'
import { Globe, Share2, Mail } from 'lucide-react'

const Footer = () => (
  <footer className="bg-primary">
    <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-3 gap-10">
      {/* Brand */}
      <div>
        <p className="text-lg font-bold text-white">Inzira</p>
        <p className="text-xs text-white/60 mt-2 leading-relaxed">
          The supportive mentor for Rwanda's next generation of professionals.
        </p>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Get Started</p>
        <div className="flex flex-col gap-3">
          <Link to="/signup" className="text-sm text-white/70 hover:text-white transition-colors">Get Started</Link>
          <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors">Sign In</Link>
        </div>
      </div>

      {/* Follow Us */}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Follow Us</p>
        <div className="flex gap-3">
          <button className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-all">
            <Globe className="h-4 w-4" />
          </button>
          <button className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-all">
            <Share2 className="h-4 w-4" />
          </button>
          <button className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-all">
            <Mail className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <div className="border-t border-white/10 pt-6 pb-6 text-center text-xs text-white/40">
      © 2024 Inzira. All rights reserved. Made for the students of Rwanda.
    </div>
  </footer>
)

export default Footer

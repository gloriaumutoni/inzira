import { Link } from 'react-router-dom'
import { Globe, Share2, Mail } from 'lucide-react'

const Footer = () => (
  <footer className="bg-primary">
    <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
      {/* Brand */}
      <div>
        <p className="text-lg font-bold text-white">Inzira</p>
        <p className="text-xs text-white/60 mt-2 leading-relaxed">
          The supportive mentor for Rwanda's next generation of professionals.
        </p>
      </div>

      {/* Platform */}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Platform</p>
        <div className="flex flex-col gap-3">
          <Link to="/explore" className="text-sm text-white/70 hover:text-white transition-colors">Explore Careers</Link>
          <Link to="/workshops" className="text-sm text-white/70 hover:text-white transition-colors">Upcoming Workshops</Link>
          <Link to="/sessions" className="text-sm text-white/70 hover:text-white transition-colors">Mentorship Sessions</Link>
          <Link to="/schools" className="text-sm text-white/70 hover:text-white transition-colors">For Schools</Link>
        </div>
      </div>

      {/* Company */}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Company</p>
        <div className="flex flex-col gap-3">
          <Link to="/about" className="text-sm text-white/70 hover:text-white transition-colors">About Us</Link>
          <Link to="/mission" className="text-sm text-white/70 hover:text-white transition-colors">Our Mission</Link>
          <Link to="/contact" className="text-sm text-white/70 hover:text-white transition-colors">Contact</Link>
          <Link to="/privacy" className="text-sm text-white/70 hover:text-white transition-colors">Privacy Policy</Link>
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

    <div className="border-t border-white/10 mt-0 pt-6 pb-6 text-center text-xs text-white/40">
      © 2024 Inzira. All rights reserved. Made for the students of Rwanda.
    </div>
  </footer>
)

export default Footer

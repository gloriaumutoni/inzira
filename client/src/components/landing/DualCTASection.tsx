import { useNavigate } from 'react-router-dom'

const DualCTASection = () => {
  const navigate = useNavigate()

  return (
    <section className="bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* For Professionals */}
        <div className="bg-primary p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-white">Are you a working professional?</h2>
          <p className="text-sm text-white/70 mt-3 leading-relaxed">
            Share your career story with students who are figuring out their path.
            No application needed — sign up and start.
          </p>
          <button
            onClick={() => navigate('/signup?role=PROFESSIONAL')}
            className="mt-6 inline-block bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Get Started
          </button>
        </div>

        {/* For Students */}
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-primary">Ready to find your path?</h2>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Explore real careers, connect with Rwandan professionals, and make
            your combination choice with confidence.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="mt-6 inline-block bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Join Inzira
          </button>
        </div>
      </div>
    </section>
  )
}

export default DualCTASection

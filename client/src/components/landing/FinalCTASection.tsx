import { useNavigate } from 'react-router-dom'

const FinalCTASection = () => {
  const navigate = useNavigate()

  return (
    <section className="bg-surface">
      <div className="max-w-xl mx-auto text-center py-24 px-6">
        <h2 className="text-3xl font-bold text-primary">Ready to start your journey?</h2>
        <p className="text-sm text-muted mt-3">
          Join hundreds of students already building their futures on Inzira today.
        </p>
        <button
          onClick={() => navigate('/signup')}
          className="mt-8 bg-primary text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Create Your Account
        </button>
      </div>
    </section>
  )
}

export default FinalCTASection

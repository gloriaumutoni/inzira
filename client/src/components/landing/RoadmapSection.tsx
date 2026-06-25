const STEPS = [
  {
    number: 1,
    title: 'Explore Careers',
    body: 'Browse through our library of 200+ detailed career paths specifically relevant to the Rwandan market.',
  },
  {
    number: 2,
    title: 'Join Workshops',
    body: 'Attend free interactive sessions led by industry leaders to learn real-world skills and insights.',
  },
  {
    number: 3,
    title: 'One-on-One Sessions',
    body: 'Book direct mentorship calls with professionals to ask personalised questions and get guided advice.',
  },
]

const RoadmapSection = () => (
  <section id="roadmap" className="bg-surface py-20 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">Your Career Roadmap</h2>
        <p className="text-sm text-muted mt-3">Three simple steps to clarify your professional future.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {STEPS.map(({ number, title, body }) => (
          <div
            key={number}
            className="bg-background rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
          >
            <div className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center mb-4">
              {number}
            </div>
            <h3 className="text-base font-semibold text-primary mt-2">{title}</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default RoadmapSection

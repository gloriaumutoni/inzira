import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToRoadmap = () => {
    document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-background">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
              Find the path that is{" "}
              <span className="text-accent">right for you</span>
            </h1>
            <p className="text-sm text-muted mt-4 leading-relaxed max-w-sm">
              Inzira helps secondary students explore career paths, connect with
              professionals, and build a roadmap for the future with confidence
              and clarity.
            </p>
            <div className="flex gap-3 mt-8 flex-wrap">
              <button
                onClick={() => navigate("/signup")}
                className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={scrollToRoadmap}
                className="border border-border text-primary px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-surface rounded-2xl shadow-md overflow-hidden">
              <div className="relative w-full h-64 bg-gradient-to-br from-accent/20 to-primary/30">
                <img
                  src="/Student%20learning.png"
                  alt="Inzira career guidance preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/30" />
                <div className="absolute top-4 left-4 bg-surface shadow-sm rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-warning text-xs">⭐</span>
                  <div>
                    <p className="text-xs text-muted leading-none">
                      Recommended
                    </p>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      Software Engineer
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-surface shadow-sm rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-success text-xs">✓</span>
                  <div>
                    <p className="text-xs font-semibold text-primary leading-none">
                      Session Confirmed
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Tomorrow at 4:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

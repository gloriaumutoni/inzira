import { Link } from "react-router-dom";
import {
  Compass,
  Users,
  Building2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const features = [
  {
    icon: Compass,
    title: "Career Discovery",
    description:
      "Explore careers mapped to Rwanda's 15 A-level subject combinations through real professional profiles and short videos.",
  },
  {
    icon: Users,
    title: "Mentorship Sessions",
    description:
      "Book a 30-minute one-on-one session with a Rwandan professional working in the field you are curious about.",
  },
  {
    icon: Building2,
    title: "Company Workshops",
    description:
      "Attend workshops hosted by Kigali companies to experience the day-to-day reality of a career before committing to it.",
  },
];

const steps = [
  "Take the interest assessment",
  "Explore matching careers and professionals",
  "Book a session or attend a workshop",
  "Choose your A-level combination with confidence",
];

const Landing = () => (
  <div className="bg-background min-h-screen">
    <Navbar />

    {/* Hero */}
    <section className="bg-primary text-white relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-80" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Find Your Path Before You Choose It
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
            Inzira connects Rwandan secondary school students with verified
            professionals and companies to make informed career and subject
            combination choices — before it is too late to change.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/login">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="ghost"
                size="lg"
                className="text-white/90 hover:text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Everything You Need to Choose Wisely
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Three ways Inzira helps you understand your future before you commit
            to the subject combination that shapes it.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="p-8 flex flex-col items-start gap-4">
              <div className="p-3 rounded-card bg-accent/10">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-primary">{title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="py-20 bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-white/70 max-w-xl mx-auto">
            Four simple steps from not knowing to choosing with confidence.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div
              key={step}
              className="flex flex-col items-center text-center gap-4"
            >
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-white/40 flex-shrink-0" />
                <p className="text-white/80 text-sm leading-relaxed">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA strip */}
    <section className="py-16 bg-accent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Ready to find your path?
        </h2>
        <p className="text-white/80 mb-8 max-w-lg mx-auto">
          Join hundreds of Rwandan students already exploring careers that match
          who they are and where they want to go.
        </p>
        <Link to="/login">
          <Button
            variant="secondary"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-accent"
          >
            Start For Free
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <p className="text-xl font-bold mb-2">Inzira</p>
            <p className="text-white/60 text-sm">
              The path to your future starts here.
            </p>
          </div>
          <div className="flex gap-6 items-start">
            <a
              href="#"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              About
            </a>
            <a
              href="#"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Contact
            </a>
            <a
              href="#"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            © 2026 Inzira. Built for Rwandan students.
          </p>
        </div>
      </div>
    </footer>
  </div>
);

export default Landing;

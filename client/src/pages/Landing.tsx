import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import StatsBar from '@/components/landing/StatsBar'
import RoadmapSection from '@/components/landing/RoadmapSection'
import CareerCarousel from '@/components/landing/CareerCarousel'
import DualCTASection from '@/components/landing/DualCTASection'
import FinalCTASection from '@/components/landing/FinalCTASection'
import Footer from '@/components/landing/Footer'

const Landing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <StatsBar />
    <RoadmapSection />
    <CareerCarousel />
    <DualCTASection />
    <FinalCTASection />
    <Footer />
  </div>
)

export default Landing

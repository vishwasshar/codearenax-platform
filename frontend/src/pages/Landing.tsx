import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TechMarquee from "../components/landing/TechMarquee";
import FeatureGrid from "../components/landing/FeatureGrid";
import Stats from "../components/landing/Stats";
import Architecture from "../components/landing/Architecture";
import Workflow from "../components/landing/Workflow";
import Timeline from "../components/landing/Timeline";
import Screenshots from "../components/landing/Screenshots";
import Roadmap from "../components/landing/Roadmap";
import FAQ from "../components/landing/FAQ";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* Navigation */}
      <Navbar />

      {/* Hero */}
      <Hero />

      {/* Technology Stack */}
      <TechMarquee />

      {/* Features */}
      <FeatureGrid />

      {/* Technical Highlights */}
      <Stats />

      {/* Architecture */}
      <Architecture />

      {/* Internal Workflow */}
      <Workflow />

      {/* User Workflow */}
      <Timeline />

      {/* Product Showcase */}
      <Screenshots />

      {/* Future Development */}
      <Roadmap />

      {/* Frequently Asked Questions */}
      <FAQ />

      {/* Footer */}
      <Footer />
    </main>
  );
}

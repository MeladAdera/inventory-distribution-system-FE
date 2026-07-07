'use client';

import { LandingNavbar } from './LandingNavbar';
import { LandingFooter } from './LandingFooter';
import { HeroSection } from './sections/HeroSection';
import { ProblemsSection } from './sections/ProblemsSection';
import { SolutionSection } from './sections/SolutionSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { WhyUsSection } from './sections/WhyUsSection';
import { ShowcaseSection } from './sections/ShowcaseSection';
import { BuiltForSection } from './sections/BuiltForSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FinalCtaSection } from './sections/FinalCtaSection';

export function LandingPage() {
  return (
    <div className="bg-page">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProblemsSection />
        <SolutionSection />
        <HowItWorksSection />
        <FeaturesSection />
        <WhyUsSection />
        <ShowcaseSection />
        <BuiltForSection />
        <TestimonialsSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}

"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Lazy load components
const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), { 
  ssr: false,
  loading: () => <div className="h-16 bg-background" />
});

const Footer = dynamic(() => import('@/components/footer').then(mod => mod.Footer), { 
  ssr: false,
  loading: () => null
});

const AboutHero = dynamic(() => import('@/components/about/about-hero').then(mod => mod.AboutHero), { 
  ssr: false,
  loading: () => <LoadingFallback />
});

const MissionSection = dynamic(() => import('@/components/about/mission-section').then(mod => mod.MissionSection), { 
  ssr: false,
  loading: () => <LoadingFallback />
});

const ValuesSection = dynamic(() => import('@/components/about/values-section').then(mod => mod.ValuesSection), { 
  ssr: false,
  loading: () => <LoadingFallback />
});

const TeamSection = dynamic(() => import('@/components/about/team-section').then(mod => mod.TeamSection), { 
  ssr: false,
  loading: () => <LoadingFallback />
});

const MilestonesSection = dynamic(() => import('@/components/about/milestones-section').then(mod => mod.MilestonesSection), { 
  ssr: false,
  loading: () => <LoadingFallback />
});

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <AboutHero />
          <MissionSection />
          <ValuesSection />
          <TeamSection />
          <MilestonesSection />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

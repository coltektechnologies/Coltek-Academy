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
const Navbar = dynamic(
  () => import('@/components/navbar').then(mod => mod.Navbar),
  { ssr: false, loading: () => <div className="h-16 bg-background" /> }
);

const Footer = dynamic(
  () => import('@/components/footer').then(mod => mod.Footer),
  { ssr: false, loading: () => null }
);

const HeroSection = dynamic(
  () => import('@/components/home/hero-section').then(mod => mod.HeroSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const StatsSection = dynamic(
  () => import('@/components/home/stats-section').then(mod => mod.StatsSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const FeaturedCourses = dynamic(
  () => import('@/components/home/featured-courses').then(mod => mod.FeaturedCourses),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const BenefitsSection = dynamic(
  () => import('@/components/home/benefits-section').then(mod => mod.BenefitsSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const TestimonialsSection = dynamic(
  () => import('@/components/home/testimonials-section').then(mod => mod.TestimonialsSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const CTASection = dynamic(
  () => import('@/components/home/cta-section').then(mod => mod.CTASection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="h-16 bg-background" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <HeroSection />
          <StatsSection />
          <FeaturedCourses />
          <BenefitsSection />
          <TestimonialsSection />
          <CTASection />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  )
}

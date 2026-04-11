"use client"

import {
  HomeHeader,
  HomeHero,
  HomeStats,
  TailorVideoSection,
  HomeFeatures,
  HomeHowItWorks,
  HomeTestimonials,
  HomePricing,
  HomeFaq,
  HomeCta,
  HomeFooter,
} from "@/components/home"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 bg-app-mesh" aria-hidden />
      <HomeHeader />
      <HomeHero />
      <HomeStats />
      <TailorVideoSection />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomeTestimonials />
      <HomePricing />
      <HomeFaq />
      <HomeCta />
      <HomeFooter />
    </div>
  )
}

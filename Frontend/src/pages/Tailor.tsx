"use client"

import { HomeHeader, HomeFooter, HomeResumeGenerator } from "@/components/home"

export default function Tailor() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 bg-app-mesh" aria-hidden />
      <HomeHeader />
      <main>
        <HomeResumeGenerator />
      </main>
      <HomeFooter />
    </div>
  )
}

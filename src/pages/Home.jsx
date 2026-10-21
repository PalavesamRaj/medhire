import React from 'react'
import Hero from '../components/home/Hero'
import StatsBar from '../components/home/StatsBar'
import Specialties from '../components/home/Specialties'
import { ForCandidates, ForRecruiters } from '../components/home/AudienceSections'
import ProcessSection from '../components/home/ProcessSection'
import MarketplacePreview from '../components/home/MarketplacePreview'
import FeaturedJobs from '../components/home/FeaturedJobs'
import Pricing from '../components/home/Pricing'
import Testimonials from '../components/home/Testimonials'
import { Faq, CtaBand } from '../components/home/FaqAndCta'

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Specialties />
      <ForCandidates />
      <ForRecruiters />
      <ProcessSection />
      <MarketplacePreview />
      <FeaturedJobs />
      <Pricing />
      <Testimonials />
      <Faq />
      <CtaBand />
    </>
  )
}

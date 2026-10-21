import React from 'react'
import SectionHeading from '../ui/SectionHeading'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const jobs = [
  { role: 'Senior Cardiologist', org: 'Apollo Hospitals', location: 'Mumbai, MH', pay: '₹25-35 LPA', type: 'Full Time' },
  { role: 'ICU Head Nurse', org: 'Fortis Healthcare', location: 'Delhi, NCR', pay: '₹8-12 LPA', type: 'Full Time' },
  { role: 'Chief Pharmacist', org: 'Max Healthcare', location: 'Bangalore, KA', pay: '₹12-18 LPA', type: 'Full Time' },
  { role: 'Radiology Technician', org: 'Manipal Hospitals', location: 'Hyderabad, TS', pay: '₹5-8 LPA', type: 'Full Time' },
]

export default function FeaturedJobs() {
  return (
    <section className="bg-ink-50/60 py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Open Positions"
          title="Featured Healthcare Opportunities"
          subtitle="Top tier medical networks publishing urgent requirements daily. Connect direct."
        />

        <div className="mt-12 flex flex-col gap-4">
          {jobs.map((j) => (
            <div
              key={j.role}
              className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-50 font-bold text-accent-700">
                  H
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{j.role}</p>
                  <p className="text-sm text-ink-500">
                    {j.org} <span className="text-ink-300">·</span> {j.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-ink-900">{j.pay}</span>
                <Badge tone="teal">{j.type}</Badge>
                <Button size="sm">Apply Now</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

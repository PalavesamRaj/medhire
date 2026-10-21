import React from 'react'
import { Stethoscope, ShieldCheck, Briefcase, FileText, ScanLine, Users, Building2, Settings, ArrowRight } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'

const roles = [
  { icon: Stethoscope, name: 'Doctors & Physicians', openings: '2,400+ openings' },
  { icon: ShieldCheck, name: 'Registered Nurses', openings: '5,800+ openings' },
  { icon: Briefcase, name: 'Pharmacists', openings: '1,200+ openings' },
  { icon: FileText, name: 'Lab Technicians', openings: '950+ openings' },
  { icon: ScanLine, name: 'Radiology Technicians', openings: '800+ openings' },
  { icon: Users, name: 'Physiotherapists', openings: '1,100+ openings' },
  { icon: Building2, name: 'Medical Coders', openings: '1,500+ openings' },
  { icon: Settings, name: 'Hospital Admin', openings: '750+ openings' },
]

export default function Specialties() {
  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="Specialties"
        title="Explore Popular Healthcare Roles"
        subtitle="Discover open opportunities tailored to your specialization and clinical credentials."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((r) => (
          <button
            key={r.name}
            className="group flex items-start justify-between rounded-xl border border-ink-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                <r.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-semibold text-ink-900">{r.name}</p>
              <p className="mt-1 text-sm text-ink-400">{r.openings}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
          </button>
        ))}
      </div>
    </section>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'
import { Twitter, Linkedin, Facebook } from 'lucide-react'
import Logo from './Logo'

const columns = [
  {
    title: 'For Candidates',
    links: [
      { label: 'Find Jobs', to: '/find-jobs' },
      { label: 'Create Profile', to: '/find-jobs' },
      { label: 'Career Resources', to: '/faq' },
      { label: 'Salary Guide', to: '/faq' },
    ],
  },
  {
    title: 'For Recruiters',
    links: [
      { label: 'Search Candidates', to: '/for-recruiters' },
      { label: 'Pricing Plan', to: '/pricing' },
      { label: 'Post a Job', to: '/for-recruiters' },
      { label: 'Recruiter Resources', to: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact Sales', to: '/contact' },
      { label: 'Technical Blog', to: '/faq' },
      { label: 'Careers', to: '/contact' },
      { label: 'Press Kit', to: '/contact' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-200">
      <div className="container-page grid grid-cols-1 gap-8 py-14 sm:grid-cols-2 sm:gap-10 sm:py-16 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <Link to="/">
            <Logo light />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-ink-400">
            Modern medical talent matching ecosystem connecting active clinicians with top
            healthcare institutions securely.
          </p>
          <div className="mt-5 flex gap-3">
            {[Twitter, Linkedin, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div
            key={col.title}
            className="border-t border-white/10 pt-6 sm:border-0 sm:pt-0"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              {col.title}
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-ink-300 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm text-ink-400 sm:flex-row">
          <p>© 2026 MedHire. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white">Terms of Service</Link>
            <Link to="" className="hover:text-white">HIPAA Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

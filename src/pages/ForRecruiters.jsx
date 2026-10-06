import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, BarChart3, Building2, Check, LockKeyhole, Search, UsersRound } from 'lucide-react'
import Button from '../components/ui/Button'
import SectionHeading from '../components/ui/SectionHeading'
import recruiterImage from '../assets/laptop-nursing-candidates.png'

const benefits = [
  { icon: BadgeCheck, title: 'Verified professionals', text: 'Review candidates whose healthcare credentials have been checked.' },
  { icon: Search, title: 'Relevant search', text: 'Filter by specialty, experience, location, and availability.' },
  { icon: LockKeyhole, title: 'Privacy by design', text: 'Candidate contact details remain protected until you unlock a profile.' },
  { icon: BarChart3, title: 'Clear hiring capacity', text: 'Manage candidate credits, team seats, and job activity in one place.' },
]

const steps = [
  ['01', 'Create your account', 'Add your organization and recruiter details.'],
  ['02', 'Verify your organization', 'Complete our review so candidate information stays in trusted hands.'],
  ['03', 'Search and connect', 'Find qualified clinicians and use credits to access the profiles you need.'],
]

export default function ForRecruiters() {
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16 sm:py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold text-brand-700"><Building2 className="h-4 w-4" /> Built for healthcare hiring teams</span><h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">Meet the healthcare talent your team needs</h1><p className="mt-5 max-w-xl text-base leading-7 text-ink-600">Search a focused network of healthcare professionals, review verified credentials, and connect with the people who fit your open roles.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/register/recruiter"><Button size="lg" icon={ArrowRight}>Create recruiter account</Button></Link><Link to="/pricing"><Button size="lg" variant="secondary">Explore plans</Button></Link></div><div className="mt-6 flex items-center gap-2 text-sm text-ink-500"><LockKeyhole className="h-4 w-4 text-teal-600" /> Candidate contact information stays private until unlocked.</div></div>
          <div className="relative"><div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-teal-100 to-brand-100 blur-2xl opacity-70" /><img src={recruiterImage} alt="Recruiter reviewing healthcare candidate profiles" className="relative w-full rounded-2xl border border-white object-cover shadow-xl" /></div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20"><SectionHeading eyebrow="A focused talent network" title="A simpler way to build your care team" subtitle="Tools for healthcare recruiters at every step, from the first search to a direct candidate connection." /><div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-bold text-ink-900">{title}</h3><p className="mt-2 text-sm leading-6 text-ink-600">{text}</p></article>)}</div></section>

      <section className="bg-ink-50/70 py-16 sm:py-20"><div className="container-page grid items-center gap-12 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Designed for confident hiring</p><h2 className="mt-3 text-3xl font-extrabold text-ink-900">Spend less time searching. Focus on the right candidates.</h2><p className="mt-4 text-sm leading-6 text-ink-600">MedHire brings the search and candidate review process into one clear workflow. Browse relevant profiles first, then use credits when you’re ready to make a connection.</p><ul className="mt-6 space-y-3">{['Search verified clinicians by specialty and experience', 'Preview professional qualifications before unlocking', 'Shortlist candidates to keep your team aligned', 'Track credits and account activity'].map((item) => <li key={item} className="flex items-start gap-3 text-sm text-ink-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{item}</li>)}</ul><Link to="/register/recruiter" className="mt-7 inline-block"><Button icon={ArrowRight}>Get started</Button></Link></div><div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recruiter workspace</p><h3 className="mt-1 text-xl font-bold text-ink-900">Your hiring, organized</h3></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Verified access</span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-ink-50 p-4"><UsersRound className="h-5 w-5 text-brand-600" /><p className="mt-3 text-2xl font-extrabold text-ink-900">Talent</p><p className="text-xs text-ink-500">Search profiles</p></div><div className="rounded-xl bg-ink-50 p-4"><LockKeyhole className="h-5 w-5 text-teal-600" /><p className="mt-3 text-2xl font-extrabold text-ink-900">Credits</p><p className="text-xs text-ink-500">Unlock when ready</p></div></div><div className="mt-4 rounded-xl border border-ink-100 p-4"><p className="text-xs font-semibold text-ink-500">A clear path to a connection</p><div className="mt-4 flex items-center justify-between gap-2 text-center">{['Search', 'Review', 'Connect'].map((item, i) => <React.Fragment key={item}><div className="flex-1"><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span><span className="mt-2 block text-xs font-medium text-ink-600">{item}</span></div>{i < 2 && <span className="h-px flex-1 bg-ink-200" />}</React.Fragment>)}</div></div></div></div></section>

      <section className="container-page py-16 sm:py-20"><SectionHeading eyebrow="Getting started" title="From sign-up to your next great hire" subtitle="A straightforward process built around verified organizations and respectful candidate access." /><div className="mt-11 grid gap-5 md:grid-cols-3">{steps.map(([number, title, text]) => <article key={number} className="rounded-xl border border-ink-200 bg-white p-6"><span className="text-sm font-extrabold text-teal-700">{number}</span><h3 className="mt-3 text-lg font-bold text-ink-900">{title}</h3><p className="mt-2 text-sm leading-6 text-ink-600">{text}</p></article>)}</div></section>

      <section className="bg-brand-900 py-14 text-white sm:py-16"><div className="container-page flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-teal-200">Ready to grow your team?</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Find your next healthcare professional</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Create a recruiter account to get your organization verified and start exploring the talent network.</p></div><div className="flex shrink-0 flex-wrap gap-3"><Link to="/register/recruiter"><Button variant="secondary" className="!bg-white !text-brand-700 hover:!bg-brand-50" icon={ArrowRight}>Join MedHire</Button></Link><Link to="/contact"><Button variant="outline">Talk to sales</Button></Link></div></div></section>
    </>
  )
}

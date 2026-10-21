import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness,
  Building2, CalendarDays, Check, ChevronDown, CircleHelp, CreditCard, FileCheck2,
  FileText, Filter, Heart, LayoutDashboard, LockKeyhole, LogOut, Menu, MoreHorizontal,
  Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Users, X,
} from 'lucide-react'
import PrototypeScreens, { prototypeDefaults } from '../components/prototype/PrototypeScreens'

const roles = ['Candidate', 'Recruiter', 'Admin']

const menu = {
  Candidate: [
    ['Overview', LayoutDashboard], ['A–Z Flow', Activity], ['Find jobs', BriefcaseBusiness], ['Applications', FileCheck2],
    ['Saved jobs', Heart], ['My profile', Users], ['Resume', FileText], ['Privacy', LockKeyhole],
  ],
  Recruiter: [
    ['Overview', LayoutDashboard], ['A–Z Flow', Activity], ['Job postings', BriefcaseBusiness], ['Find candidates', Search],
    ['Applicants', Users], ['Shortlist', Heart], ['Plans & credits', CreditCard], ['Team', Users],
    ['Organization', Building2],
  ],
  Admin: [
    ['Overview', LayoutDashboard], ['A–Z Flow', Activity], ['Candidates', Users], ['Recruiters', Building2],
    ['Job moderation', BriefcaseBusiness], ['Payments', CreditCard], ['Support', CircleHelp],
    ['Staff & roles', ShieldCheck], ['Settings', Settings2],
  ],
}

const roleContent = {
  Candidate: {
    name: 'Sarah Johnson', initials: 'SJ', title: 'Registered Nurse', organization: 'Candidate workspace',
    greeting: 'Good morning, Sarah', subtitle: 'Your next opportunity is closer than you think.',
    stats: [['Profile strength', '82%', '+12% this month', 'up'], ['Applications', '08', '3 awaiting review', 'neutral'], ['Profile views', '24', '+6 this week', 'up']],
    rows: [
      ['Staff Nurse · ICU', 'Northstar Medical Center', 'Bengaluru, Karnataka', '₹6–8 LPA', 'NEW'],
      ['Clinical Nurse', 'Green Valley Hospital', 'Hyderabad, Telangana', '₹5–7 LPA', 'MATCH'],
      ['Nurse Practitioner', 'CityCare Health', 'Pune, Maharashtra', '₹8–10 LPA', 'NEW'],
    ],
  },
  Recruiter: {
    name: 'Anita Sharma', initials: 'AS', title: 'Recruitment Lead', organization: 'Northstar Medical Group',
    greeting: 'Good morning, Anita', subtitle: 'Here’s what’s happening with your hiring today.',
    stats: [['Active job posts', '12', '2 pending review', 'neutral'], ['New applicants', '48', '+18 this week', 'up'], ['Available credits', '240', 'Across 3 roles', 'neutral']],
    rows: [
      ['Registered Nurse · ICU', 'Bengaluru, Karnataka', '18 applicants', 'Posted 2 days ago', 'ACTIVE'],
      ['Senior Pharmacist', 'Hyderabad, Telangana', '12 applicants', 'Posted 5 days ago', 'ACTIVE'],
      ['Lab Technician', 'Pune, Maharashtra', '8 applicants', 'Awaiting review', 'PENDING'],
    ],
  },
  Admin: {
    name: 'Rohan Mehta', initials: 'RM', title: 'Super administrator', organization: 'MedHire operations',
    greeting: 'Good morning, Rohan', subtitle: 'Platform activity and items that need your attention.',
    stats: [['Candidates', '2,480', '+8.4% this month', 'up'], ['Recruiters', '186', '12 need verification', 'neutral'], ['Open jobs', '324', '8 awaiting review', 'neutral']],
    rows: [
      ['Sunrise Health Network', 'Recruiter verification', 'Documents submitted', '10 min ago', 'REVIEW'],
      ['Registered Nurse · ICU', 'Job moderation', 'Northstar Medical Group', '32 min ago', 'REVIEW'],
      ['Candidate resume review', 'Candidate moderation', 'New submission', '1 hour ago', 'REVIEW'],
    ],
  },
}

const applications = [
  ['Staff Nurse · ICU', 'Northstar Medical Center', 'Under Review', 'Oct 06, 2026'],
  ['Clinical Nurse', 'Green Valley Hospital', 'Interview', 'Oct 04, 2026'],
  ['Nurse Practitioner', 'CityCare Health', 'Applied', 'Oct 02, 2026'],
  ['Registered Nurse', 'Lakeside Medical', 'Shortlisted', 'Sep 28, 2026'],
]

const applicants = [
  ['Emily Chen', 'Critical Care Nurse', '8 years', '92%'],
  ['Aarav Patel', 'Registered Nurse', '5 years', '88%'],
  ['Priya Nair', 'ICU Nurse', '6 years', '85%'],
]

function cn(...values) { return values.filter(Boolean).join(' ') }

function Tag({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold', tones[tone])}>{children}</span>
}

function Modal({ role, onClose, onComplete }) {
  const [sent, setSent] = useState(false)
  const labels = role === 'Candidate' ? ['Job title', 'Specialty', 'Location'] : role === 'Recruiter' ? ['Job title', 'Specialty', 'Location'] : ['Name', 'Email address', 'Role']
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={onClose}>
    <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={event => event.stopPropagation()}>
      <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Quick action</p><h2 className="mt-1 text-xl font-bold text-slate-900">{role === 'Admin' ? 'Invite administrator' : role === 'Recruiter' ? 'Create a job post' : 'Set up a job alert'}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={18}/></button></div>
      {sent ? <div className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-800"><div className="flex items-center gap-2 font-semibold"><Check size={18}/> Prototype action saved</div><p className="mt-2 text-emerald-700">This preview uses sample data. No message or record was sent to a backend.</p><button onClick={onClose} className="mt-3 font-semibold text-emerald-800">Done</button></div> : <form onSubmit={event => { event.preventDefault(); onComplete?.(); setSent(true) }} className="space-y-4">
        {labels.map((label, i) => <label key={label} className="block text-sm font-medium text-slate-700">{label}{i === 2 && role === 'Candidate' ? <select className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"><option>All locations</option><option>Bengaluru</option><option>Hyderabad</option></select> : <input required={i < 2} placeholder={role === 'Admin' && i === 1 ? 'name@hospital.com' : `Enter ${label.toLowerCase()}`} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"/>}</label>)}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">{role === 'Candidate' ? 'Create alert' : role === 'Recruiter' ? 'Save draft' : 'Send invite'}</button></div>
      </form>}
    </section>
  </div>
}

function Stat({ item, index }) {
  const [label, value, note, trend] = item
  const icons = [Activity, BriefcaseBusiness, Users]
  const Icon = icons[index % icons.length]
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,.025)]">
    <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className="rounded-xl bg-teal-50 p-2 text-teal-700"><Icon size={17}/></span></div>
    <div className="mt-3 flex items-end justify-between gap-3"><strong className="text-3xl font-bold tracking-tight text-slate-900">{value}</strong><span className={cn('mb-1 inline-flex items-center gap-1 text-xs font-semibold', trend === 'up' ? 'text-emerald-700' : 'text-slate-500')}>{trend === 'up' ? <ArrowUpRight size={14}/> : null}{note}</span></div>
  </article>
}

function WelcomeCard({ role, content, onAction }) {
  const copy = role === 'Candidate'
    ? ['Complete your profile to stand out', 'Add your certifications and keep your resume current to get noticed by more hospitals.']
    : role === 'Recruiter'
      ? ['Meet your next great hire', 'Review matched healthcare professionals and invite your team to collaborate.']
      : ['Your team is keeping things moving', 'Review the latest submissions and keep the platform healthy and trusted.']
  return <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c3c49] via-[#125b64] to-[#14827d] p-6 text-white shadow-sm sm:p-7">
    <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10"/><div className="absolute -right-1 top-6 h-40 w-40 rounded-full border border-white/10"/>
    <div className="relative max-w-xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-50"><Sparkles size={14}/> Your MedHire workspace</div><h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{copy[0]}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-teal-50/90">{copy[1]}</p><button onClick={onAction} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#104d56] transition hover:bg-teal-50">{role === 'Candidate' ? 'Complete profile' : role === 'Recruiter' ? 'Find candidates' : 'Review queue'}<ArrowRight size={16}/></button></div>
  </div>
}

function CandidateCard({ candidate, index }) {
  const colors = ['bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700']
  return <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5"><div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold', colors[index % colors.length])}>{candidate[0].split(' ').map(x => x[0]).join('')}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{candidate[0]}</p><p className="truncate text-xs text-slate-500">{candidate[1]} · {candidate[2]}</p></div><Tag tone="green">{candidate[3]} match</Tag></div>
}

function DataTable({ role, selected, query, setQuery, onAction }) {
  if (role === 'Candidate' && selected === 'Applications') return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="font-bold text-slate-900">Your applications</h3><p className="mt-1 text-xs text-slate-500">Track your progress with each care team.</p></div><button className="text-sm font-semibold text-teal-700">View all</button></div><div className="divide-y divide-slate-100">{applications.map((row, i) => <div key={row[0]} className="flex flex-wrap items-center gap-3 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><BriefcaseBusiness size={17}/></span><div className="min-w-48 flex-1"><p className="text-sm font-semibold text-slate-800">{row[0]}</p><p className="mt-0.5 text-xs text-slate-500">{row[1]}</p></div><Tag tone={row[2] === 'Interview' ? 'violet' : row[2] === 'Under Review' ? 'blue' : 'slate'}>{row[2]}</Tag><span className="w-24 text-right text-xs text-slate-400">{row[3]}</span></div>)}</div></div>
  if (role === 'Recruiter' && ['Applicants', 'Find candidates', 'Shortlist'].includes(selected)) return <div className="rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h3 className="font-bold text-slate-900">{selected === 'Applicants' ? 'Recommended applicants' : 'Healthcare professionals'}</h3><p className="mt-1 text-xs text-slate-500">Strong matches for Registered Nurse · ICU</p></div><button onClick={onAction} className="rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white">Browse candidates</button></div><div className="space-y-2 p-4">{applicants.map((person, i) => <CandidateCard key={person[0]} candidate={person} index={i}/>)}</div></div>
  const entries = roleContent[role].rows.filter(row => row.join(' ').toLowerCase().includes(query.toLowerCase()))
  const title = role === 'Candidate' ? 'Recommended for you' : role === 'Recruiter' ? 'Your job postings' : 'Needs your attention'
  const sub = role === 'Candidate' ? 'Based on your experience and preferences' : role === 'Recruiter' ? 'Keep track of your open healthcare roles' : 'Items waiting for an operations review'
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h3 className="font-bold text-slate-900">{selected === 'Overview' ? title : selected}</h3><p className="mt-1 text-xs text-slate-500">{sub}</p></div><div className="flex items-center gap-2"><label className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={15}/><input aria-label="Search records" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} className="w-40 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-teal-500 sm:w-52"/></label><button className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Filter"><Filter size={16}/></button></div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><th className="px-5 py-3">{role === 'Admin' ? 'Item' : role === 'Candidate' ? 'Position' : 'Job title'}</th><th className="px-5 py-3">{role === 'Recruiter' ? 'Location' : role === 'Candidate' ? 'Organization' : 'Area'}</th><th className="px-5 py-3">{role === 'Recruiter' ? 'Activity' : role === 'Candidate' ? 'Details' : 'Description'}</th><th className="px-5 py-3">{role === 'Candidate' ? 'Compensation' : 'Updated'}</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{entries.map((row, i) => <tr key={row[0]} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{role === 'Admin' ? <ShieldCheck size={16}/> : <BriefcaseBusiness size={16}/>}</span><span className="whitespace-nowrap text-sm font-semibold text-slate-800">{row[0]}</span></div></td><td className="px-5 py-4 text-xs text-slate-600">{row[1]}</td><td className="px-5 py-4 text-xs text-slate-600">{row[2]}</td><td className="px-5 py-4 text-xs text-slate-600">{row[3]}</td><td className="px-5 py-4"><Tag tone={role === 'Admin' ? 'amber' : row[4] === 'ACTIVE' || row[4] === 'MATCH' || role === 'Candidate' ? 'green' : 'blue'}>{row[4]}</Tag></td><td className="px-5 py-4"><button onClick={onAction} aria-label={`Open ${row[0]}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-teal-700"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table></div>
    {entries.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No matching records in this sample view.</div>}
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-400"><span>Showing {entries.length} of {roleContent[role].rows.length} sample records</span><div className="flex gap-1"><button className="rounded-lg border border-slate-200 px-2.5 py-1.5">Previous</button><button className="rounded-lg bg-teal-50 px-2.5 py-1.5 font-semibold text-teal-700">1</button><button className="rounded-lg border border-slate-200 px-2.5 py-1.5">Next</button></div></div>
  </div>
}

function SidePanel({ role, onAction }) {
  if (role === 'Candidate') return <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h3 className="font-bold text-slate-900">Profile strength</h3><p className="mt-1 text-xs text-slate-500">A complete profile gets more views.</p></div><span className="text-lg font-bold text-teal-700">82%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[82%] rounded-full bg-teal-600"/></div><div className="mt-4 space-y-3 text-xs"><p className="flex items-center gap-2 text-slate-600"><Check size={15} className="text-emerald-600"/> Resume approved</p><p className="flex items-center gap-2 text-slate-600"><Check size={15} className="text-emerald-600"/> Work experience added</p><p className="flex items-center gap-2 text-slate-500"><Plus size={15}/> Add certifications</p></div><button onClick={onAction} className="mt-5 w-full rounded-xl border border-teal-200 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50">Improve profile</button></section>
  if (role === 'Recruiter') return <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h3 className="font-bold text-slate-900">New applicants</h3><p className="mt-1 text-xs text-slate-500">For your open roles</p></div><button className="text-xs font-semibold text-teal-700">See all</button></div><div className="mt-4 space-y-3">{applicants.map((person, i) => <CandidateCard key={person[0]} candidate={person} index={i}/>)}</div><button onClick={onAction} className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">View applicants</button></section>
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h3 className="font-bold text-slate-900">Review queue</h3><p className="mt-1 text-xs text-slate-500">Prioritized by latest submission</p></div><Tag tone="amber">8 pending</Tag></div><div className="mt-4 space-y-4">{[['Organization documents', '4 submissions'], ['Job approvals', '3 new posts'], ['Resume moderation', '1 resume']].map(([title, note], i) => <div key={title} className="flex items-center gap-3"><span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', i === 0 ? 'bg-violet-50 text-violet-700' : i === 1 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700')}>{i === 0 ? <Building2 size={16}/> : i === 1 ? <BriefcaseBusiness size={16}/> : <FileText size={16}/>}</span><div className="flex-1"><p className="text-sm font-semibold text-slate-800">{title}</p><p className="text-xs text-slate-500">{note}</p></div><ArrowRight size={15} className="text-slate-400"/></div>)}</div><button onClick={onAction} className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open review queue</button></section>
}

export default function FrontendPrototype() {
  const [role, setRole] = useState('Candidate')
  const [selected, setSelected] = useState('Overview')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [demo, setDemo] = useState(() => {
    try { return { ...prototypeDefaults, ...JSON.parse(localStorage.getItem('medhire-prototype-state') || '{}') } }
    catch { return { ...prototypeDefaults } }
  })
  const content = roleContent[role]
  const NavIcon = useMemo(() => menu[role].find(([label]) => label === selected)?.[1] || LayoutDashboard, [role, selected])

  useEffect(() => { localStorage.setItem('medhire-prototype-state', JSON.stringify(demo)) }, [demo])

  function changeRole(value) { setRole(value); setSelected('Overview'); setQuery(''); setMobileNav(false) }
  function selectPage(label) { setSelected(label); setMobileNav(false) }
  function actionForRole() { setModal(true) }
  function completeModalAction() {
    if (role === 'Recruiter') setDemo(value => ({ ...value, jobCreate: true }))
    if (role === 'Admin') setDemo(value => ({ ...value, teamInvites: [...value.teamInvites, 'new.admin@medhire.example'] }))
  }

  return <div className="min-h-screen bg-[#f5f8fa] text-slate-800">
    <div className="flex min-h-screen">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0', mobileNav ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white"><Activity size={22}/></span><div><p className="text-lg font-bold tracking-tight text-slate-900">med<span className="text-teal-700">hire</span></p><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Healthcare careers</p></div></div>
        <div className="px-4 pt-5"><p className="px-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Switch workspace</p><div className="mt-2 grid grid-cols-3 rounded-xl bg-slate-100 p-1">{roles.map(item => <button key={item} onClick={() => changeRole(item)} className={cn('rounded-lg px-1 py-2 text-[11px] font-semibold transition', role === item ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>{item}</button>)}</div></div>
        <div className="mt-6 px-4"><p className="px-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p><nav className="mt-2 space-y-1">{menu[role].map(([label, Icon]) => <button key={label} onClick={() => selectPage(label)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition', selected === label ? 'bg-teal-50 text-teal-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}><Icon size={17}/><span className="flex-1">{label}</span>{label === 'Applications' && role === 'Candidate' && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-teal-700">4</span>}{label === 'Job moderation' && role === 'Admin' && <span className="h-2 w-2 rounded-full bg-amber-400"/>}</button>)}</nav></div>
        <div className="mt-auto p-4"><div className="rounded-2xl bg-[#f1f8f8] p-4"><div className="flex items-center gap-2 text-teal-800"><ShieldCheck size={16}/><span className="text-xs font-bold">Your data is protected</span></div><p className="mt-2 text-[11px] leading-5 text-slate-500">A trusted space for healthcare professionals and employers.</p><button className="mt-2 text-[11px] font-semibold text-teal-700">Learn about privacy <ArrowRight className="ml-1 inline" size={12}/></button></div><button className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50"><LogOut size={16}/> Sign out</button></div>
      </aside>
      {mobileNav && <button className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-7 xl:px-9">
          <div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu size={19}/></button><div><p className="text-xs text-slate-400">{content.organization}</p><div className="flex items-center gap-1 text-sm font-semibold text-slate-700">{role} portal <ChevronDown size={14} className="text-slate-400"/></div></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 md:flex"><Search size={15}/><span>Search anything</span><kbd className="ml-10 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div><button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell size={18}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500"/></button><span className="hidden h-8 w-px bg-slate-200 sm:block"/><button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d6eeea] text-xs font-bold text-teal-900">{content.initials}</span><span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-800">{content.name}</span><span className="block text-[10px] text-slate-400">{content.title}</span></span><ChevronDown size={14} className="hidden text-slate-400 sm:block"/></button></div>
        </header>

        <div className="mx-auto max-w-[1500px] p-4 sm:p-7 xl:p-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2"><span className="text-xs font-semibold text-slate-400">{role} portal</span><span className="text-slate-300">/</span><span className="flex items-center gap-1 text-xs font-semibold text-teal-700"><NavIcon size={13}/>{selected}</span></div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{selected === 'Overview' ? content.greeting : selected}</h1><p className="mt-1.5 text-sm text-slate-500">{selected === 'Overview' ? content.subtitle : `A clear view of your ${selected.toLowerCase()} in one place.`}</p></div><div className="flex items-center gap-2"><button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm sm:flex"><CalendarDays size={15}/> Oct 1 – Oct 8 <ChevronDown size={13}/></button><button onClick={actionForRole} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800"><Plus size={16}/>{role === 'Candidate' ? 'Create job alert' : role === 'Recruiter' ? 'Create job post' : 'Invite admin'}</button></div></div>

          {selected === 'Overview' ? <>
            <WelcomeCard role={role} content={content} onAction={actionForRole}/>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{content.stats.map((item, i) => <Stat key={item[0]} item={item} index={i}/>)}</div>
            <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(290px,.82fr)]">
              <DataTable role={role} selected={selected} query={query} setQuery={setQuery} onAction={actionForRole}/>
              <div className="space-y-5"><SidePanel role={role} onAction={actionForRole}/>
                <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><h3 className="font-bold text-slate-900">Activity this week</h3><p className="mt-1 text-xs text-slate-500">A quick snapshot of your workspace</p></div><button aria-label="More activity options" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"><MoreHorizontal size={17}/></button></div><div className="mt-5 flex h-28 items-end justify-between gap-2">{[38,54,45,74,58,88,68].map((height,i)=><div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={cn('w-full max-w-8 rounded-t-md',i===5?'bg-teal-700':'bg-teal-100')} style={{height:`${height}%`}}/><span className="text-[10px] text-slate-400">{['M','T','W','T','F','S','S'][i]}</span></div>)}</div><div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-700"><ArrowUpRight size={14}/> 12.8% <span className="font-normal text-slate-400">compared with last week</span></div></section>
              </div>
            </div>
          </> : <PrototypeScreens role={role} page={selected} demo={demo} update={setDemo} onAction={actionForRole}/>}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-[11px] text-slate-400"><span>© 2026 MedHire · Healthcare hiring, made thoughtful.</span><div className="flex gap-4"><button className="hover:text-slate-600">Help center</button><button className="hover:text-slate-600">Privacy</button><button className="inline-flex items-center gap-1 hover:text-slate-600"><SlidersHorizontal size={12}/> Design preview</button></div></footer>
        </div>
      </main>
    </div>
    {modal && <Modal role={role} onClose={() => setModal(false)} onComplete={completeModalAction}/>} 
  </div>
}

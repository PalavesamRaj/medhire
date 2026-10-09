import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, CheckCircle2, Clock3, Mail, Search, ShieldCheck,
  UserMinus, UserPlus, Users,
} from 'lucide-react'
import { recruiterApi } from '../../lib/recruiterApi'
import { RecruiterApiError, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'

const statusTone = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (['active', 'accepted'].includes(normalized)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['invited', 'pending'].includes(normalized)) return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'TM'
}

function StatCard({ label, value, icon: Icon, description }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </article>
  )
}

function TeamField({ label, children }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>
}

const inputClass = 'mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50'

export default function RecruiterTeam() {
  const [team, setTeam] = useState({ items: [], seatsUsed: 0, seatsTotal: 0 })
  const [form, setForm] = useState({ fullName: '', email: '', designation: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await recruiterApi.getTeam()
      const data = response?.data || response
      setTeam({ items: data?.items || [], seatsUsed: data?.seatsUsed ?? 0, seatsTotal: data?.seatsTotal ?? 0 })
    } catch (reason) {
      setError(reason)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const activeCount = team.items.filter((member) => ['active', 'accepted'].includes(String(member.status || '').toLowerCase())).length
  const invitedCount = team.items.filter((member) => ['invited', 'pending'].includes(String(member.status || '').toLowerCase())).length
  const seatsRemaining = Math.max(0, team.seatsTotal - team.seatsUsed)
  const seatPercent = team.seatsTotal > 0 ? Math.min(100, Math.round((team.seatsUsed / team.seatsTotal) * 100)) : 0
  const full = team.seatsTotal > 0 && team.seatsUsed >= team.seatsTotal

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return team.items.filter((member) => {
      const status = String(member.status || '').toLowerCase()
      const matchesFilter = filter === 'ALL' || (filter === 'ACTIVE' ? ['active', 'accepted'].includes(status) : ['invited', 'pending'].includes(status))
      const searchable = [member.fullName, member.email, member.designation, member.role].filter(Boolean).join(' ').toLowerCase()
      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [team.items, query, filter])

  const invite = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice('')
    try {
      await recruiterApi.inviteTeamMember({ fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), designation: form.designation.trim() })
      setForm({ fullName: '', email: '', designation: '' })
      setNotice('Invitation sent. Your colleague must accept it before they can access the organization.')
      await load()
    } catch (reason) {
      setError(reason)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (member) => {
    const userId = String(member.userId || member.id || '')
    if (!userId) return
    setBusyId(userId)
    setError(null)
    setNotice('')
    try {
      await recruiterApi.removeTeamMember(userId)
      setNotice('Team member access was removed.')
      await load()
    } catch (reason) {
      setError(reason)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Recruiter workspace</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Team &amp; access</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Invite colleagues to help manage your organization’s hiring activity.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700"><Users className="h-4 w-4 text-blue-600" />{team.items.length} {team.items.length === 1 ? 'team member' : 'team members'}</span>
      </header>

      {error && <RecruiterApiError error={error} onRetry={load} />}
      {notice && <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</p>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Team overview">
        <StatCard label="Active members" value={activeCount} icon={Users} description="People with accepted access" />
        <StatCard label="Pending invitations" value={invitedCount} icon={Clock3} description="Invitations waiting for acceptance" />
        <StatCard label="Available seats" value={seatsRemaining} icon={ShieldCheck} description={`${team.seatsUsed} of ${team.seatsTotal} organization seats in use`} />
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <form onSubmit={invite} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/60 p-5 sm:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><UserPlus className="h-5 w-5" /></span>
            <div><h2 className="text-lg font-bold text-slate-900">Invite a teammate</h2><p className="mt-0.5 text-sm text-slate-500">Send an invitation to join your organization.</p></div>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <TeamField label="Full name"><input required maxLength={120} autoComplete="name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="e.g. Jordan Lee" className={inputClass} /></TeamField>
            <TeamField label="Work email"><input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="jordan@hospital.com" className={inputClass} /></TeamField>
            <TeamField label="Designation"><input required maxLength={120} value={form.designation} onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))} placeholder="e.g. Talent Acquisition" className={inputClass} /></TeamField>
            {full && <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />All organization seats are currently in use.</p>}
            <div className="border-t border-slate-100 pt-4">
              <button type="submit" disabled={saving || full || loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Mail className="h-4 w-4" />{saving ? 'Sending invitation…' : 'Send invitation'}</button>
              <p className="mt-3 text-xs leading-5 text-slate-500">Invitees need to accept the email invitation before they can access your organization.</p>
            </div>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6" aria-labelledby="seats-heading">
          <div className="flex items-start justify-between gap-3">
            <div><h2 id="seats-heading" className="text-base font-bold text-slate-900">Organization seats</h2><p className="mt-1 text-sm text-slate-500">Your current team capacity</p></div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Users className="h-5 w-5" /></span>
          </div>
          <div className="mt-6 flex items-end justify-between gap-3">
            <p className="text-3xl font-bold tracking-tight text-slate-900">{team.seatsUsed}<span className="ml-1 text-base font-medium text-slate-400">/ {team.seatsTotal}</span></p>
            <p className="pb-1 text-sm font-semibold text-slate-600">{seatsRemaining} available</p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Organization seats used" aria-valuemin={0} aria-valuemax={team.seatsTotal || 1} aria-valuenow={team.seatsUsed}>
            <div className={`h-full rounded-full transition-all ${full ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${seatPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{seatPercent}% of your organization’s seats are in use.</p>
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Access is organization-wide</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">Invited colleagues can work with your organization’s recruiter tools after accepting their invitation.</p>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div><h2 className="text-lg font-bold text-slate-900">People with access</h2><p className="mt-1 text-sm text-slate-500">Review invitations and manage your organization’s team.</p></div>
          <label className="relative block sm:w-72"><span className="sr-only">Search team members</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, role" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
        </div>
        <div className="flex gap-2 border-b border-slate-100 px-5 py-3 sm:px-6" role="group" aria-label="Filter team members">
          {[['ALL', 'Everyone'], ['ACTIVE', 'Active'], ['INVITED', 'Invited']].map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}{key === 'ALL' ? ` (${team.items.length})` : key === 'ACTIVE' ? ` (${activeCount})` : ` (${invitedCount})`}</button>)}
        </div>

        {loading ? <div className="p-5 sm:p-6"><RecruiterLoading label="Loading team members…" /></div> : visibleMembers.length ? (
          <ul className="divide-y divide-slate-100">
            {visibleMembers.map((member) => {
              const userId = String(member.userId || member.id || '')
              const owner = String(member.role || '').toLowerCase() === 'owner'
              return <li key={userId || member.email} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{initials(member.fullName)}</span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-bold text-slate-900">{member.fullName || 'Team member'}</h3>{owner && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">Owner</span>}</div><p className="mt-0.5 truncate text-sm text-slate-500">{member.email || 'Email unavailable'}{member.designation ? ` · ${member.designation}` : ''}</p></div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(member.status)}`}>{String(member.status || 'Unknown').toLowerCase()}</span>
                  {!owner && <button type="button" disabled={busyId === userId || !userId} onClick={() => remove(member)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50">{busyId === userId ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" /> : <UserMinus className="h-4 w-4" />}{busyId === userId ? 'Removing…' : 'Remove'}</button>}
                </div>
              </li>
            })}
          </ul>
        ) : (
          <div className="px-5 py-12 text-center sm:px-6">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Users className="h-6 w-6" /></span>
            <h3 className="mt-3 text-sm font-bold text-slate-800">{team.items.length ? 'No matching team members' : 'No teammates yet'}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{team.items.length ? 'Try a different search or filter.' : 'Invite a colleague to share your organization’s hiring work.'}</p>
            {team.items.length > 0 && <button type="button" onClick={() => { setQuery(''); setFilter('ALL') }} className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">Clear filters</button>}
          </div>
        )}
      </section>
    </div>
  )
}

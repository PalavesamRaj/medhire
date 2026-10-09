import React, { useCallback, useEffect, useState } from 'react'
import { Mail, UserMinus, UserPlus, Users } from 'lucide-react'
import { recruiterApi } from '../../lib/recruiterApi'
import { RecruiterApiError, RecruiterLoading } from '../../components/recruiter/RecruiterApiState'

export default function RecruiterTeam() {
  const [team, setTeam] = useState({ items: [], seatsUsed: 0, seatsTotal: 0 })
  const [form, setForm] = useState({ fullName: '', email: '', designation: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { const response = await recruiterApi.getTeam(); const data = response?.data || response; setTeam({ items: data?.items || [], seatsUsed: data?.seatsUsed ?? 0, seatsTotal: data?.seatsTotal ?? 0 }) }
    catch (reason) { setError(reason) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  const invite = async (event) => {
    event.preventDefault(); setSaving(true); setError(null); setNotice('')
    try { await recruiterApi.inviteTeamMember({ fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), designation: form.designation.trim() }); setForm({ fullName: '', email: '', designation: '' }); setNotice('Invitation sent. The colleague must accept it before they can access your organization.'); await load() }
    catch (reason) { setError(reason) } finally { setSaving(false) }
  }
  const remove = async (member) => {
    setBusyId(member.userId); setError(null); setNotice('')
    try { await recruiterApi.removeTeamMember(member.userId); setNotice('Team member access was removed.'); await load() }
    catch (reason) { setError(reason) } finally { setBusyId('') }
  }
  return <div className="flex flex-col gap-6"><header><p className="text-xs font-bold uppercase tracking-wide text-teal-600">Recruiter workspace</p><h1 className="mt-1 text-2xl font-extrabold text-slate-900">Team members</h1><p className="mt-1 text-sm text-slate-500">Invite colleagues using your organization’s available seats.</p></header>
    {error && <RecruiterApiError error={error} onRetry={load} />}{notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-blue-600"/><div><h2 className="font-bold">Organization seats</h2><p className="text-sm text-slate-500">{team.seatsUsed} used of {team.seatsTotal}</p></div></div></section>
    <form onSubmit={invite} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3"><label className="text-xs font-semibold text-slate-600">Full name<input required maxLength={120} value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Designation<input required maxLength={120} value={form.designation} onChange={event => setForm({ ...form, designation: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal"/></label><div className="sm:col-span-3"><button type="submit" disabled={saving || team.seatsUsed >= team.seatsTotal} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50"><UserPlus className="h-4 w-4"/>{saving ? 'Sending…' : 'Invite colleague'}</button></div></form>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><h2 className="border-b border-slate-100 p-5 font-bold">People with access</h2>{loading ? <RecruiterLoading label="Loading team…"/> : team.items.length ? <ul className="divide-y divide-slate-100">{team.items.map(member => <li key={member.userId} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-semibold text-slate-900">{member.fullName} <span className="ml-1 text-xs font-normal text-slate-500">{member.role}</span></p><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Mail className="h-3.5 w-3.5"/>{member.email} · {member.status}</p></div>{member.role !== 'owner' && <button type="button" disabled={busyId === member.userId} onClick={() => remove(member)} className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 disabled:opacity-50"><UserMinus className="h-4 w-4"/>Remove access</button>}</li>)}</ul> : <p className="p-5 text-sm text-slate-500">No teammates are listed.</p>}</section>
  </div>
}

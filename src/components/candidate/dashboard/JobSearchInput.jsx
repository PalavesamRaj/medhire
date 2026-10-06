import React, { useEffect, useState } from 'react'
import { Input } from '../../ui/FormControls'
import CandidateIcon from './CandidateIcon'
import { candidateDashboardApi } from '../../../lib/candidateDashboardApi'

function jobsFrom(response) {
  const data = response?.data || response || {}
  if (Array.isArray(data)) return data
  return data.jobs || data.results || data.items || []
}

export default function JobSearchInput({ field = 'q', label, placeholder, value, onChange, className = '' }) {
  const [suggestions, setSuggestions] = useState([])
  const [searched, setSearched] = useState(false)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const query = value.trim()

  useEffect(() => {
    if (!query.length) { setSuggestions([]); setSearched(false); setFailed(false); setOpen(false); return undefined }
    let active = true
    setFailed(false)
    setSearched(false)
    const timer = setTimeout(async () => {
      try {
        const results = await candidateDashboardApi.searchJobs({ [field]: query })
        if (!active) return
        setSuggestions(jobsFrom(results).slice(0, 6))
        setSearched(true)
        setOpen(true)
      } catch {
        if (!active) return
        setSuggestions([])
        setSearched(false)
        setFailed(true)
        setOpen(true)
      }
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [field, query])

  const textFor = (job) => field === 'hospital' ? job.hospital || job.organizationName || '' : field === 'location' ? job.location || '' : job.title || job.jobTitle || ''
  return <div className="relative min-w-0">
    <CandidateIcon name="search" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-600" />
    <Input aria-label={label} type="search" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} onFocus={() => { if (query.length >= 2) setOpen(true) }} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }} className={`w-full !pl-10 ${className}`} aria-expanded={open} aria-autocomplete="list" />
    {open && query.length > 0 && <div role="listbox" aria-label={`${label} suggestions`} className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-auto rounded-lg border border-ink-200 bg-white p-1 shadow-lg">
      {suggestions.length ? suggestions.map((job) => <button type="button" role="option" aria-selected="false" key={job.id || `${textFor(job)}-${job.location}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(textFor(job)); setOpen(false) }} className="block w-full rounded-md px-3 py-2 text-left hover:bg-brand-50"><span className="block text-sm font-semibold text-ink-900">{textFor(job) || 'Healthcare opportunity'}</span><span className="block text-xs text-ink-600">{[job.hospital || job.organizationName, job.location].filter(Boolean).join(' · ')}</span></button>) : failed ? <p className="px-3 py-2 text-sm text-amber-700">Live suggestions are unavailable. Try again when the job service is connected.</p> : searched ? <p className="px-3 py-2 text-sm text-ink-600">No matching {field === 'q' ? 'jobs' : `${label.toLowerCase()} matches`} found.</p> : <p className="px-3 py-2 text-sm text-ink-600">Checking live results…</p>}
    </div>}
  </div>
}

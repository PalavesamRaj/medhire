import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { notificationsApi } from '../../lib/notificationsApi'

export default function NotificationBell() {
  const navigate = useNavigate()
  const box = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState('')

  const notificationPath = (item) => {
    const paths = {
      RESUME_APPROVED: '/candidate/resume-management', RESUME_REJECTED: '/candidate/resume-management',
      APPLICATION_STATUS_CHANGED: '/candidate/applications', ORGANIZATION_APPROVED: '/recruiter/dashboard',
      ORGANIZATION_REJECTED: '/recruiter/verification-pending', JOB_APPROVED: '/recruiter/jobs',
      JOB_REJECTED: '/recruiter/jobs', JOB_CLOSED: '/recruiter/jobs',
      NEW_APPLICATION: item.jobId ? `/recruiter/jobs/${encodeURIComponent(item.jobId)}/applications` : '/recruiter/jobs',
      PLAN_PURCHASED: '/recruiter/payment-history',
    }
    const mapped = paths[String(item.type || '').toUpperCase()]
    if (mapped) return mapped
    return /^\/(candidate|recruiter)\//.test(item.link || '') ? item.link : ''
  }

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.list()
      setItems(data.items)
      setUnread(data.unreadCount)
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to load notifications.')
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!open) return undefined
    const onClick = (event) => { if (box.current && !box.current.contains(event.target)) setOpen(false) }
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  const openItem = async (item) => {
    setOpen(false)
    if (!item.read) {
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)))
      setUnread((count) => Math.max(0, count - 1))
      notificationsApi.markRead(item.id).catch(() => load())
    }
    const path = notificationPath(item)
    if (path) navigate(path)
  }

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead()
      setItems((current) => current.map((entry) => ({ ...entry, read: true })))
      setUnread(0)
    } catch (requestError) {
      setError(requestError.message || 'Unable to update notifications.')
    }
  }

  return <div className="relative" ref={box}>
    <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100">
      <Bell className="h-5 w-5" />
      {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && <section aria-label="Notifications" className="absolute right-0 top-11 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
        {unread > 0 && <button type="button" onClick={markAll} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Mark all read</button>}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
      {!error && items.length === 0 && <p className="mt-3 text-xs text-slate-500">You have no notifications yet.</p>}
      <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
        {items.map((item) => <li key={item.id}>
          <button type="button" onClick={() => openItem(item)} className={`w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 ${item.read ? '' : 'bg-blue-50'}`}>
            <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
            {item.message && <span className="mt-0.5 block text-xs text-slate-600">{item.message}</span>}
            {item.createdAt && <span className="mt-1 block text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>}
          </button>
        </li>)}
      </ul>
    </section>}
  </div>
}

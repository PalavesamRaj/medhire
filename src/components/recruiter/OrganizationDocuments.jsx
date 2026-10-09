import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { recruiterApi } from '../../lib/recruiterApi'

const TYPES = [
  ['REGISTRATION_CERTIFICATE', 'Hospital registration certificate'],
  ['LICENSE', 'Clinical establishment licence'],
  ['AUTHORIZATION_LETTER', 'Recruiter authorization letter'],
  ['OTHER', 'Other supporting document'],
]
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg']

// Lets a hospital upload proof so the admin can actually verify the organization.
export default function OrganizationDocuments({ editable = true }) {
  const [items, setItems] = useState([])
  const [type, setType] = useState(TYPES[0][0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await recruiterApi.getOrganizationDocuments()
      setItems(data?.items || data?.data?.items || [])
    } catch (requestError) { setError(requestError.message) }
  }, [])
  useEffect(() => { load() }, [load])

  async function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!ALLOWED.includes(file.type)) return setError('Upload a PDF, PNG or JPG file.')
    if (file.size > MAX_BYTES) return setError('The file must be 5 MB or smaller.')
    setBusy(true); setError('')
    try { await recruiterApi.uploadOrganizationDocument(file, type); await load() }
    catch (requestError) { setError(requestError.message || 'Upload failed. Please try again.') }
    finally { setBusy(false) }
  }
  async function remove(id) {
    setBusy(true); setError('')
    try { await recruiterApi.deleteOrganizationDocument(id); await load() }
    catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-5" aria-label="Verification documents">
      <h2 className="text-sm font-bold text-slate-900">Verification documents</h2>
      <p className="mt-1 text-sm text-slate-500">Upload proof of your hospital or organization so our team can approve your account faster. PDF, PNG or JPG, up to 5 MB each.</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <ul className="mt-3 divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-700"><FileText className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{item.fileName}</span><span className="shrink-0 text-xs text-slate-400">{TYPES.find(([value]) => value === item.type)?.[1] || item.type}</span></span>
            {editable && <button type="button" disabled={busy} onClick={() => remove(item.id)} aria-label={`Remove ${item.fileName}`} className="text-slate-400 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}
          </li>
        ))}
        {!items.length && <li className="py-2 text-sm text-slate-400">No documents uploaded yet.</li>}
      </ul>
      {editable && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select aria-label="Document type" value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onFile} />
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><Upload className="h-4 w-4" />{busy ? 'Uploading…' : 'Upload document'}</button>
        </div>
      )}
    </section>
  )
}

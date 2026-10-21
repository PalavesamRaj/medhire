import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, RefreshCw, Trash2, Upload } from 'lucide-react'
import { recruiterApi } from '../../lib/recruiterApi'

const TYPES = [
  ['REGISTRATION_CERTIFICATE', 'Hospital registration certificate'],
  ['BUSINESS_LICENSE', 'Business license'],
  ['TAX_ID', 'Tax identification'],
  ['ACCREDITATION', 'Accreditation'],
  ['OTHER', 'Other supporting document'],
]
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg']

function getDocumentRows(payload) {
  const pending = [payload]
  const visited = new Set()
  while (pending.length) {
    const value = pending.shift()
    if (!value || typeof value !== 'object' || visited.has(value)) continue
    visited.add(value)
    if (Array.isArray(value)) return value.map(normalizeDocument)
    for (const key of ['documents', 'organizationDocuments', 'organization_documents', 'verificationDocuments', 'verification_documents', 'documentList', 'document_list', 'items', 'results', 'records']) {
      if (Array.isArray(value[key])) return value[key].map(normalizeDocument)
      if (value[key] && typeof value[key] === 'object') pending.push(value[key])
    }
    for (const key of ['data', 'result', 'payload']) {
      if (value[key] && typeof value[key] === 'object') pending.push(value[key])
    }
  }
  return []
}

function normalizeDocument(item = {}) {
  return {
    ...item,
    id: item.documentId || item.document_id || item.id || item._id,
    type: item.documentType || item.document_type || item.type,
    fileName: item.fileName || item.file_name || item.originalName || item.originalFilename || item.filename || item.name || 'Organization document',
    reviewStatus: item.reviewStatus || item.review_status || item.review_state || item.status || item.approvalStatus || item.approval_status,
    uploadedAt: item.uploadedAt || item.uploaded_at || item.createdAt || item.created_at,
  }
}

function unwrapObject(payload) {
  let value = payload
  for (let depth = 0; depth < 5 && value && typeof value === 'object' && !Array.isArray(value); depth += 1) {
    if (value.document && typeof value.document === 'object') return value.document
    if (value.data && typeof value.data === 'object') value = value.data
    else if (value.result && typeof value.result === 'object') value = value.result
    else break
  }
  return value || {}
}

function formatStatus(value) {
  return String(value).toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function OrganizationDocuments({ editable = true }) {
  const [items, setItems] = useState([])
  const [type, setType] = useState(TYPES[0][0])
  const [busy, setBusy] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [replaceId, setReplaceId] = useState(null)
  const input = useRef(null)

  const load = useCallback(async () => {
    setLoadingList(true)
    try {
      const payload = await recruiterApi.getOrganizationDocuments()
      const rows = getDocumentRows(payload)
      setItems(rows)
      setError('')
      return rows
    } catch (requestError) {
      setError(requestError.message || 'Unable to load organization documents.')
      return null
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!ALLOWED.includes(file.type)) {
      setError('Upload a PDF, PNG or JPG file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('The file must be 10 MiB or smaller.')
      return
    }

    const previousId = replaceId
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await recruiterApi.uploadOrganizationDocument(file, type)
      const uploaded = normalizeDocument({ ...unwrapObject(response), fileName: file.name, documentType: type })
      const rows = await load()
      if (!rows) throw new Error('The document uploaded, but the list could not be refreshed. Use Refresh list to check it.')

      // Use the upload response to keep the new row visible even if the list endpoint
      // briefly returns a stale result.
      const alreadyListed = uploaded.id
        ? rows.some((item) => item.id === uploaded.id)
        : rows.some((item) => item.fileName === uploaded.fileName && item.type === uploaded.type)
      if (!alreadyListed) {
        setItems((current) => [{ ...uploaded, localKey: `uploaded-${Date.now()}` }, ...current])
      }

      if (previousId && uploaded.id && previousId !== uploaded.id) {
        try {
          await recruiterApi.deleteOrganizationDocument(previousId)
          await load()
          setMessage('Document replaced successfully.')
        } catch (deleteError) {
          setMessage(`The new document was uploaded, but the previous file could not be removed: ${deleteError.message}`)
        }
      } else if (previousId && !uploaded.id) {
        setMessage('The new document was uploaded. The previous file is still listed because the server did not return its new document ID; remove the old copy if you no longer need it.')
      } else {
        setMessage('Document uploaded successfully.')
      }
      setReplaceId(null)
    } catch (requestError) {
      setError(requestError.message || 'Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function startReplacement(item) {
    setType(TYPES.some(([value]) => value === item.type) ? item.type : TYPES[0][0])
    setReplaceId(item.id)
    setError('')
    setMessage(`Choose a new file to replace ${item.fileName}. The current file remains available until the new upload succeeds.`)
    input.current?.click()
  }

  async function remove(item) {
    if (!item.id) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await recruiterApi.deleteOrganizationDocument(item.id)
      await load()
      setMessage('Document removed.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove this document.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-5" aria-label="Verification documents">
      <h2 className="text-sm font-bold text-slate-900">{editable ? 'Verification documents' : 'Organization verification documents'}</h2>
      <p className="mt-1 text-sm text-slate-500">{editable
        ? 'Submit your organization documents here before MedHire reviews your account. Pending Verification means the review is not complete; an admin can approve the organization after reviewing these documents. PDF, PNG or JPG, up to 10 MiB each. Uploads require an active organization owner or admin membership.'
        : 'Documents submitted to MedHire for organization verification. Review the file and its status below; contact support if a document needs to be updated.'}</p>

      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">Uploaded documents ({items.length})</h3>
        <button type="button" disabled={busy} onClick={load} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />Refresh list</button>
      </div>

      <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
        {items.map((item, index) => (
          <li key={item.id || item.localKey || `${item.fileName}-${index}`} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-2.5">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{item.fileName}</p>
                <p className="mt-0.5 text-xs text-slate-500">{TYPES.find(([value]) => value === item.type)?.[1] || item.type || 'Organization document'}{item.uploadedAt ? ` · Uploaded ${new Date(item.uploadedAt).toLocaleDateString()}` : ''}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 pl-6 sm:pl-0">
              {item.reviewStatus && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">{formatStatus(item.reviewStatus)}</span>}
              {editable && item.id && <>
                <button type="button" disabled={busy} onClick={() => startReplacement(item)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />Replace</button>
                <button type="button" disabled={busy} onClick={() => remove(item)} aria-label={`Remove ${item.fileName}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-100 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Remove</button>
              </>}
            </div>
          </li>
        ))}
        {!items.length && loadingList && <li className="px-3 py-3 text-sm text-slate-400">Loading uploaded documents…</li>}
        {!items.length && !loadingList && !error && <li className="px-3 py-3 text-sm text-slate-400">No documents uploaded yet.</li>}
      </ul>

      {editable && <div className="mt-3 flex flex-wrap items-center gap-3">
        <select aria-label="Document type" value={type} onChange={(event) => { setType(event.target.value); setReplaceId(null); setMessage('') }} className="h-10 min-w-64 rounded-lg border border-slate-200 bg-white px-3 text-sm">
          {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onFile} />
        <button type="button" disabled={busy} onClick={() => { setReplaceId(null); input.current?.click() }} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><Upload className="h-4 w-4" />{busy ? 'Uploading…' : replaceId ? 'Choose replacement file' : 'Upload document'}</button>
      </div>}
    </section>
  )
}

import React, { useEffect, useRef } from 'react'
import Button from '../../ui/Button'

export default function ConfirmDialog({ title, children, confirmLabel = 'Confirm', onConfirm, onClose }) {
  const dialog = useRef(null)
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close() }, [])
  return <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); onClose() }} aria-labelledby="confirm-title" className="candidate-app w-[calc(100%-32px)] max-w-md rounded-xl border border-ink-200 bg-white p-6 text-ink-900 shadow-xl backdrop:bg-ink-900/40"><h2 id="confirm-title" className="med-heading-2">{title}</h2><div className="med-body my-4 text-ink-600">{children}</div><div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onClose} autoFocus>Cancel</Button><Button type="button" variant="destructive" onClick={onConfirm}>{confirmLabel}</Button></div></dialog>
}

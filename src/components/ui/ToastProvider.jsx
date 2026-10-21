import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message })
  }, [])

  const closeToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(closeToast, 4500)
    return () => window.clearTimeout(timeout)
  }, [toast, closeToast])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:left-auto sm:w-[min(92vw,380px)]" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-accent-200 bg-white px-4 py-3.5 text-ink-900 shadow-xl shadow-ink-900/10 ring-1 ring-black/5 animate-[toast-in_180ms_ease-out]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <p className="flex-1 pt-0.5 text-sm font-medium leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={closeToast}
              className="rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const showToast = useContext(ToastContext)
  if (!showToast) throw new Error('useToast must be used inside ToastProvider')
  return showToast
}

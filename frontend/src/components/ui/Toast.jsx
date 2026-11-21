/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

/**
 * Small pop-up message in the corner that disappears after 3 seconds.
 * Usage in any page:
 *   const toast = useToast()
 *   toast.success('Lead saved')
 *   toast.error('Could not save')
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  function show(message, type) {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list, { id, message, type }])
    // remove it after 3 seconds
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3000)
  }

  const toast = {
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="fixed right-4 bottom-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium text-white shadow-pop ${
              t.type === 'success' ? 'bg-success-700' : 'bg-danger-700'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

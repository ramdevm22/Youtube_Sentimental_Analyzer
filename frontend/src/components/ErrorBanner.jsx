import { AlertTriangle, X } from 'lucide-react'

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 bg-red-950 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="hover:text-red-100 transition-colors">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

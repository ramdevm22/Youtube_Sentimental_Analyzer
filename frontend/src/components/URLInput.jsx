import { useState } from 'react'
import { Search, Youtube } from 'lucide-react'

export default function URLInput({ onAnalyze, loading }) {
  const [url, setUrl] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed) onAnalyze(trimmed)
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Youtube size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">YouTube Sentiment Analyzer</h1>
          <p className="text-sm text-gray-400">RAG-powered analysis of any YouTube video</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a YouTube URL or video ID…"
          className="input-field"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <div className="spinner w-4 h-4" />
              Analyzing…
            </>
          ) : (
            <>
              <Search size={16} />
              Analyze
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3">
        Example: https://www.youtube.com/watch?v=Gfr50f6ZBvo
      </p>
    </div>
  )
}

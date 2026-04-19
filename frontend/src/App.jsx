import { useState } from 'react'
import URLInput from './components/URLInput'
import SentimentDashboard from './components/SentimentDashboard'
import ChatBox from './components/ChatBox'
import ErrorBanner from './components/ErrorBanner'
import { analyzeVideo } from './utils/api'
import { Github } from 'lucide-react'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleAnalyze(url) {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await analyzeVideo(url)
      setResult(data)
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Analysis failed.'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.01-.08z"/>
              </svg>
            </div>
            <span className="font-semibold text-white text-sm">YT Sentiment</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <Github size={16} />
            GitHub
          </a>
        </div>

        {/* URL Input */}
        <URLInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Error */}
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="card h-28 bg-gray-800/50" />
            <div className="grid grid-cols-3 gap-3">
              {[0,1,2].map(i => <div key={i} className="card h-16 bg-gray-800/50" />)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card h-44 bg-gray-800/50" />
              <div className="card h-44 bg-gray-800/50" />
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            <SentimentDashboard result={result} />
            <ChatBox videoId={result.video_id} />
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 pt-4">
          Built with FastAPI · LangChain · FAISS · OpenAI · React
        </p>
      </div>
    </div>
  )
}

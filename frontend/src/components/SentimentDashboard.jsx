import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react'

const SENTIMENT_COLORS = {
  positive: { bg: 'bg-green-900/40', border: 'border-green-700', text: 'text-green-400', icon: TrendingUp },
  negative: { bg: 'bg-red-900/40',   border: 'border-red-700',   text: 'text-red-400',   icon: TrendingDown },
  neutral:  { bg: 'bg-gray-800',     border: 'border-gray-600',  text: 'text-gray-300',  icon: Minus },
  mixed:    { bg: 'bg-amber-900/40', border: 'border-amber-700', text: 'text-amber-400', icon: AlertCircle },
}

function ScoreGauge({ score }) {
  const pct = ((score + 1) / 2) * 100
  const color = score > 0.2 ? '#22c55e' : score < -0.2 ? '#ef4444' : '#f59e0b'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm text-gray-400 font-medium">Sentiment Score</div>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${pct * 3.14} 314`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score.toFixed(2)}</span>
          <span className="text-xs text-gray-500">-1 to +1</span>
        </div>
      </div>
    </div>
  )
}

function ThemeRadar({ themes }) {
  if (!themes?.length) return null
  const data = themes.slice(0, 6).map((t, i) => ({
    subject: t.length > 14 ? t.slice(0, 14) + '…' : t,
    value: 90 - i * 10,
  }))
  return (
    <div>
      <div className="text-sm text-gray-400 font-medium mb-2">Key Themes</div>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={70}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Radar dataKey="value" fill="#ef4444" fillOpacity={0.25} stroke="#ef4444" strokeWidth={1.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function AspectBar({ positives = [], negatives = [] }) {
  const data = [
    ...positives.slice(0, 3).map(p => ({ label: p.length > 20 ? p.slice(0,20)+'…' : p, value: 1, type: 'positive' })),
    ...negatives.slice(0, 3).map(n => ({ label: n.length > 20 ? n.slice(0,20)+'…' : n, value: 1, type: 'negative' })),
  ]
  if (!data.length) return null
  return (
    <div>
      <div className="text-sm text-gray-400 font-medium mb-3">Aspects Detected</div>
      <div className="space-y-2">
        {positives.slice(0, 4).map((p, i) => (
          <div key={i} className="flex items-start gap-2">
            <ThumbsUp size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-300">{p}</span>
          </div>
        ))}
        {negatives.slice(0, 4).map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <ThumbsDown size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-300">{n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SentimentDashboard({ result }) {
  if (!result) return null
  const { sentiment, video_id, transcript_length, num_chunks, analysis_time_sec } = result
  const s = sentiment || {}
  const overall = (s.overall_sentiment || 'neutral').toLowerCase()
  const colors = SENTIMENT_COLORS[overall] || SENTIMENT_COLORS.neutral
  const Icon = colors.icon

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className={`card border ${colors.border} ${colors.bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Icon size={24} className={colors.text} />
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Overall Sentiment</div>
              <div className={`text-2xl font-bold capitalize ${colors.text}`}>{overall}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Confidence</div>
            <div className="text-xl font-semibold text-white">
              {s.confidence != null ? `${Math.round(s.confidence * 100)}%` : '—'}
            </div>
          </div>
        </div>

        {s.summary && (
          <p className="mt-4 text-gray-300 text-sm leading-relaxed border-t border-gray-700 pt-4">
            {s.summary}
          </p>
        )}

        {s.emotional_tone && (
          <div className="mt-2">
            <span className="badge bg-gray-800 text-gray-300">🎭 {s.emotional_tone}</span>
          </div>
        )}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Video ID', value: video_id },
          { label: 'Transcript chars', value: transcript_length?.toLocaleString() },
          { label: 'Chunks indexed', value: num_chunks },
        ].map(m => (
          <div key={m.label} className="card text-center">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className="text-sm font-semibold text-white truncate">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card flex justify-center">
          <ScoreGauge score={s.sentiment_score ?? 0} />
        </div>
        <div className="card">
          <ThemeRadar themes={s.key_themes} />
        </div>
      </div>

      {/* Aspects */}
      {((s.positive_aspects?.length > 0) || (s.negative_aspects?.length > 0)) && (
        <div className="card">
          <AspectBar positives={s.positive_aspects} negatives={s.negative_aspects} />
        </div>
      )}
    </div>
  )
}

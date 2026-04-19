import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, MessageSquare } from 'lucide-react'
import { chatWithVideo } from '../utils/api'

const SUGGESTED = [
  'Can you summarize this video?',
  'What are the main topics discussed?',
  'What is the overall tone of the speaker?',
  'Are there any controversial points raised?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`chat-bubble flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-red-600' : 'bg-gray-700'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-gray-300" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-red-600 text-white rounded-tr-sm'
          : 'bg-gray-800 text-gray-200 rounded-tl-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  )
}

export default function ChatBox({ videoId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Video analyzed! Ask me anything about it — I can answer questions using the transcript content.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(question) {
    const q = question || input.trim()
    if (!q || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const data = await chatWithVideo(videoId, q)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, something went wrong: ${err.response?.data?.detail || err.message}`
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card flex flex-col h-[520px]">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-800">
        <MessageSquare size={18} className="text-red-400" />
        <h2 className="font-semibold text-white">Ask about this video</h2>
        <span className="ml-auto badge bg-green-900/40 text-green-400 border border-green-700">
          RAG powered
        </span>
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 rounded-full px-3 py-1.5 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, i) => <Message key={i} msg={m} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <Bot size={14} className="text-gray-300" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask a question about the video…"
          className="input-field text-sm"
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="btn-primary px-3"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

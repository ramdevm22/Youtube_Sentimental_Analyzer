/**
 * popup.js — drives the extension popup UI.
 * Communicates with the FastAPI backend running at localhost:8000.
 */

const API_BASE = 'http://localhost:8000/api/v1'

// ── State ──────────────────────────────────────────────────────────────────────
let currentVideoId = null
let isAnalyzing    = false
let isChatting     = false

// ── DOM refs ───────────────────────────────────────────────────────────────────
const videoBanner      = document.getElementById('videoBanner')
const videoLabel       = document.getElementById('videoLabel')
const analyzeBtn       = document.getElementById('analyzeBtn')
const errorBox         = document.getElementById('errorBox')
const loadingBox       = document.getElementById('loadingBox')
const resultsDiv       = document.getElementById('results')
const overallSentiment = document.getElementById('overallSentiment')
const scoreValue       = document.getElementById('scoreValue')
const scoreBar         = document.getElementById('scoreBar')
const summaryText      = document.getElementById('summaryText')
const themesSection    = document.getElementById('themesSection')
const themeChips       = document.getElementById('themeChips')
const chatArea         = document.getElementById('chatArea')
const chatInput        = document.getElementById('chatInput')
const chatSend         = document.getElementById('chatSend')
const openFullLink     = document.getElementById('openFullLink')

// ── Init ───────────────────────────────────────────────────────────────────────
async function init() {
  // Ask active tab's content script for the video ID
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_ID' }, (response) => {
      if (chrome.runtime.lastError) return // content script not injected yet
      if (response?.videoId) setVideoId(response.videoId)
    })
  } catch (_) {}
}

function setVideoId(id) {
  currentVideoId = id
  videoBanner.classList.remove('no-video')
  videoLabel.textContent = `Video: ${id}`
  analyzeBtn.disabled = false
  analyzeBtn.textContent = 'Analyze This Video'
  openFullLink.href = `http://localhost:5173?v=${id}`
  openFullLink.style.display = 'block'
}

// ── Analyze ────────────────────────────────────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
  if (!currentVideoId || isAnalyzing) return
  isAnalyzing = true

  setError(null)
  resultsDiv.style.display = 'none'
  loadingBox.style.display = 'block'
  analyzeBtn.disabled = true
  analyzeBtn.textContent = 'Analyzing…'

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentVideoId }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Analysis failed')
    }

    const data = await res.json()
    renderResults(data)
  } catch (err) {
    setError(err.message)
  } finally {
    isAnalyzing = false
    loadingBox.style.display = 'none'
    analyzeBtn.disabled = false
    analyzeBtn.textContent = 'Re-Analyze'
  }
})

function renderResults(data) {
  const s = data.sentiment || {}
  const overall = (s.overall_sentiment || 'neutral').toLowerCase()

  overallSentiment.textContent = overall.charAt(0).toUpperCase() + overall.slice(1)
  overallSentiment.className = `sentiment-value ${overall}`

  const score = s.sentiment_score ?? 0
  scoreValue.textContent = score.toFixed(2)
  scoreValue.className = `sentiment-value ${score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'}`

  const pct = ((score + 1) / 2) * 100
  const barColor = score > 0.2 ? '#22c55e' : score < -0.2 ? '#ef4444' : '#f59e0b'
  scoreBar.style.width = `${pct}%`
  scoreBar.style.background = barColor

  summaryText.textContent = s.summary || ''

  if (s.key_themes?.length) {
    themeChips.innerHTML = s.key_themes
      .map(t => `<span class="theme-chip">${t}</span>`)
      .join('')
    themesSection.style.display = 'block'
  }

  resultsDiv.style.display = 'block'
}

// ── Chat ───────────────────────────────────────────────────────────────────────
function appendMessage(role, text) {
  const div = document.createElement('div')
  div.className = `msg ${role === 'user' ? 'user' : 'bot'}`
  div.innerHTML = `<div class="bubble">${text}</div>`
  chatArea.appendChild(div)
  chatArea.scrollTop = chatArea.scrollHeight
}

async function sendChat() {
  const q = chatInput.value.trim()
  if (!q || !currentVideoId || isChatting) return

  isChatting = true
  chatInput.value = ''
  chatSend.disabled = true
  appendMessage('user', q)

  // Typing indicator
  const typing = document.createElement('div')
  typing.className = 'msg bot'
  typing.innerHTML = '<div class="bubble"><div class="dots"><span></span><span></span><span></span></div></div>'
  chatArea.appendChild(typing)
  chatArea.scrollTop = chatArea.scrollHeight

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: currentVideoId, question: q }),
    })
    const data = await res.json()
    chatArea.removeChild(typing)
    appendMessage('bot', res.ok ? data.answer : (data.detail || 'Error getting answer.'))
  } catch (err) {
    chatArea.removeChild(typing)
    appendMessage('bot', `Error: ${err.message}`)
  } finally {
    isChatting = false
    chatSend.disabled = false
  }
}

chatSend.addEventListener('click', sendChat)
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat() })

// ── Helpers ────────────────────────────────────────────────────────────────────
function setError(msg) {
  if (msg) {
    errorBox.textContent = msg
    errorBox.style.display = 'block'
  } else {
    errorBox.style.display = 'none'
  }
}

// ── Listen for URL changes from content script ─────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'VIDEO_ID_CHANGED' && msg.videoId) {
    setVideoId(msg.videoId)
    // Auto-reset results when video changes
    resultsDiv.style.display = 'none'
    chatArea.innerHTML = '<div class="msg bot"><div class="bubble">Video changed! Click Analyze to start.</div></div>'
  }
})

init()

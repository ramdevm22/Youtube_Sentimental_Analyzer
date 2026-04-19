/**
 * content.js — injected on every YouTube page.
 * Extracts the video ID from the URL and sends it to the popup
 * via chrome.runtime messaging.
 */

function extractVideoId(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v') || null
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1) || null
    }
  } catch (_) {}
  return null
}

// Notify the background/popup whenever the URL changes (SPA navigation)
let lastVideoId = null

function notifyVideoId() {
  const videoId = extractVideoId(window.location.href)
  if (videoId && videoId !== lastVideoId) {
    lastVideoId = videoId
    chrome.runtime.sendMessage({ type: 'VIDEO_ID_CHANGED', videoId })
  }
}

notifyVideoId()

// YouTube is a SPA — watch for pushState / URL changes
const _pushState = history.pushState.bind(history)
history.pushState = function (...args) {
  _pushState(...args)
  setTimeout(notifyVideoId, 500)
}

window.addEventListener('popstate', () => setTimeout(notifyVideoId, 500))

// Also respond to popup asking for current videoId
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_VIDEO_ID') {
    sendResponse({ videoId: extractVideoId(window.location.href) })
  }
})

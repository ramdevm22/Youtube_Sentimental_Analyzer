/**
 * background.js — service worker for the extension.
 * Caches the current video ID so the popup can read it immediately.
 */

let currentVideoId = null

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'VIDEO_ID_CHANGED') {
    currentVideoId = msg.videoId
    // Store in extension storage for persistence
    chrome.storage.local.set({ currentVideoId: msg.videoId })
  }

  if (msg.type === 'GET_CACHED_VIDEO_ID') {
    sendResponse({ videoId: currentVideoId })
  }
})

// On tab update, clear cache if navigating away from YouTube
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    if (!tab.url?.includes('youtube.com/watch')) {
      currentVideoId = null
      chrome.storage.local.remove('currentVideoId')
    }
  }
})

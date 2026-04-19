import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE,
  timeout: 120_000, // transcript fetch + embedding can be slow
})

export async function analyzeVideo(url) {
  const { data } = await api.post('/analyze', { url })
  return data
}

export async function chatWithVideo(videoId, question) {
  const { data } = await api.post('/chat', { video_id: videoId, question })
  return data
}

export async function getVideoStatus(videoId) {
  const { data } = await api.get(`/video/${videoId}/status`)
  return data
}

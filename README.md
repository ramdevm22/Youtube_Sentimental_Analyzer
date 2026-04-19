# 🎬 YouTube Sentiment Analyzer

A full-stack AI application that performs **RAG-powered sentiment analysis** and **Q&A** on any YouTube video — available as a **web app** and **Chrome extension**. Runs completely free using **Ollama** (local AI) or optionally with OpenAI.

![Demo](docs/demo.gif)

## ✨ Features

- 🎯 **Sentiment Analysis** — overall sentiment, score, confidence, key themes, emotional tone
- 💬 **RAG-powered Q&A** — ask questions answered directly from the video transcript
- 🔌 **Chrome Extension** — works directly on any YouTube video page
- 🆓 **100% Free** — runs locally with Ollama (no API costs)
- 📊 **MLflow tracking** — optional experiment tracking
- 🚀 **CI/CD** — GitHub Actions pipeline

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | FastAPI, LangChain, FAISS, Ollama |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Extension | Chrome Extension Manifest v3 |
| AI (Free) | Ollama + llama3.2 + nomic-embed-text |
| AI (Paid) | OpenAI gpt-4o-mini (optional) |

## 📁 Project Structure

```
youtube-sentiment-analyzer/
├── backend/
│   ├── src/
│   │   ├── rag/
│   │   │   ├── ingestion.py     # YouTube transcript fetch + chunking
│   │   │   ├── retriever.py     # FAISS vector store (Ollama/OpenAI embeddings)
│   │   │   └── chain.py         # LangChain RAG chains (Ollama/OpenAI LLM)
│   │   ├── sentiment/
│   │   │   └── analyzer.py      # Sentiment analysis pipeline
│   │   └── config.py            # Settings (supports Ollama + OpenAI)
│   ├── api/
│   │   ├── main.py              # FastAPI app
│   │   └── routes.py            # /analyze, /chat endpoints
│   ├── .env.example
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
├── frontend/                    # React web app
├── extension/                   # Chrome extension
└── .github/workflows/           # CI/CD
```

## 🚀 Quick Start (Free - Ollama)

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com/download) installed

### 1. Install & Start Ollama

Download from https://ollama.com/download, install it, then:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

Verify it's running: open http://localhost:11434 — should show "Ollama is running"

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# .env is already configured for Ollama — no changes needed!

pip install -r requirements.txt
python run.py
```

API running at: http://127.0.0.1:8000
Swagger docs at: http://127.0.0.1:8000/docs

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

### 4. Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Open any YouTube video → click the extension icon 🎬

## 🌐 Using OpenAI Instead (Optional)

If you have OpenAI credits, edit `backend/.env`:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

## 📡 API Reference

### POST /api/v1/analyze
```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

### POST /api/v1/chat
```json
{ "video_id": "dQw4w9WgXcQ", "question": "What is this video about?" }
```

### GET /api/v1/video/{video_id}/status

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

## 🐳 Docker

```bash
docker-compose up --build
```

## 📤 Pushing to GitHub

```bash
git init
git add .
git commit -m "Initial commit: YouTube Sentiment Analyzer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/youtube-sentiment-analyzer.git
git push -u origin main
```

## ☁️ Deployment (Making it Public)

Since this app uses Ollama (local AI), for public deployment you have two options:

**Option A — Switch to OpenAI for cloud deployment:**
- Set `LLM_PROVIDER=openai` in your server environment
- Deploy backend to Render/Railway (free tier available)
- Deploy frontend to Vercel/Netlify (free)

**Option B — Keep Ollama, share locally via ngrok:**
```bash
ngrok http 8000
```
This gives you a public URL that tunnels to your local server.

## 📝 License

MIT

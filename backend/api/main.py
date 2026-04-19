from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="YouTube Sentiment Analyzer API",
    description="RAG-powered sentiment analysis and Q&A for YouTube videos",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    return {"status": "ok", "message": "YouTube Sentiment Analyzer API"}


@app.get("/health")
def health():
    return {"status": "healthy"}

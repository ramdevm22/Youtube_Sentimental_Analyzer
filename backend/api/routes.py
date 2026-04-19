import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.sentiment.analyzer import VideoAnalyzer, _log_to_mlflow
from src.rag.ingestion import ingest_video, extract_video_id
from src.rag.retriever import build_vector_store
from src.utils import session_store

router = APIRouter()


# Request / Response models

class AnalyzeRequest(BaseModel):
    url: str


class ChatRequest(BaseModel):
    video_id: str
    question: str


class AnalyzeResponse(BaseModel):
    video_id: str
    transcript_length: int
    num_chunks: int
    sentiment: dict
    analysis_time_sec: float


class ChatResponse(BaseModel):
    video_id: str
    question: str
    answer: str


# Endpoints

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    try:
        video_id = extract_video_id(request.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        start = time.time()
        transcript, chunks, language = ingest_video(request.url)
        vector_store = build_vector_store(chunks)
        analyzer = VideoAnalyzer(
            video_id=video_id,
            transcript=transcript,
            vector_store=vector_store,
             language=language,
        )
        session_store.save(video_id, analyzer)
        sentiment = analyzer.analyze_sentiment()
        elapsed = time.time() - start

        from src.config import get_settings
        settings = get_settings()
        _log_to_mlflow(
            params={"model": settings.openai_model, "chunk_size": settings.chunk_size, "num_chunks": len(chunks), "language": language},
            metrics={"analysis_time_sec": round(elapsed, 2), "sentiment_score": sentiment.get("sentiment_score", 0)},
        )

        return AnalyzeResponse(
            video_id=video_id,
            transcript_length=len(transcript),
            num_chunks=len(chunks),
            sentiment=sentiment,
            analysis_time_sec=round(elapsed, 2),
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    analyzer: VideoAnalyzer = session_store.load(request.video_id)
    if not analyzer:
        raise HTTPException(
            status_code=404,
            detail=f"Video '{request.video_id}' not found. Please call /analyze first.",
        )
    try:
        answer = analyzer.ask(request.question)
        return ChatResponse(
            video_id=request.video_id,
            question=request.question,
            answer=answer,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/video/{video_id}/status")
async def video_status(video_id: str):
    return {
        "video_id": video_id,
        "analyzed": session_store.exists(video_id),
    }

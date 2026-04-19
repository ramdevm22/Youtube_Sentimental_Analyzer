import json
import time
from langchain_community.vectorstores import FAISS
from src.rag.ingestion import ingest_video
from src.rag.retriever import build_vector_store, get_retriever
from src.rag.chain import build_qa_chain, build_sentiment_chain
from src.config import get_settings


class VideoAnalyzer:
    def __init__(self, video_id: str, transcript: str,
                 vector_store: FAISS, language: str = "english"):
        self.video_id = video_id
        self.transcript = transcript
        self.language = language
        self.vector_store = vector_store
        retriever = get_retriever(vector_store)
        self.qa_chain = build_qa_chain(retriever)
        self.sentiment_fn = build_sentiment_chain(retriever)

    def ask(self, question: str) -> str:
        return self.qa_chain.invoke(question)

    def analyze_sentiment(self) -> dict:
        result = self.sentiment_fn(self.transcript, self.language)
        try:
            # Strip markdown code fences if model adds them
            content = result.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return json.loads(content.strip())
        except json.JSONDecodeError:
            return {
                "error": "Failed to parse sentiment result",
                "raw": result.content,
                "overall_sentiment": "neutral",
                "sentiment_score": 0.0,
                "confidence": 0.0,
                "language": self.language,
                "key_themes": [],
                "summary": "Could not parse analysis.",
                "emotional_tone": "unknown",
                "positive_aspects": [],
                "negative_aspects": [],
            }


def _log_to_mlflow(params: dict, metrics: dict):
    try:
        import mlflow
        from src.config import get_settings
        s = get_settings()
        mlflow.set_tracking_uri(s.mlflow_tracking_uri)
        mlflow.set_experiment(s.mlflow_experiment_name)
        with mlflow.start_run():
            mlflow.log_params(params)
            mlflow.log_metrics(metrics)
    except Exception:
        pass


def analyze_video(url_or_id: str) -> dict:
    start = time.time()
    transcript, chunks, language = ingest_video(url_or_id)
    vector_store = build_vector_store(chunks)
    analyzer = VideoAnalyzer(
        video_id=url_or_id,
        transcript=transcript,
        vector_store=vector_store,
        language=language,
    )
    sentiment = analyzer.analyze_sentiment()
    elapsed = time.time() - start
    settings = get_settings()
    _log_to_mlflow(
        params={"model": settings.ollama_model, "chunk_size": settings.chunk_size, "language": language},
        metrics={"analysis_time_sec": round(elapsed, 2), "sentiment_score": sentiment.get("sentiment_score", 0)},
    )
    return {
        "video_id": url_or_id,
        "transcript_length": len(transcript),
        "num_chunks": len(chunks),
        "language": language,
        "sentiment": sentiment,
        "analysis_time_sec": round(elapsed, 2),
    }
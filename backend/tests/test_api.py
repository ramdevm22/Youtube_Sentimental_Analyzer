"""
Tests for the YouTube Sentiment Analyzer backend.
LLM and YouTube API calls are mocked — no API credits consumed.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from api.main import app

client = TestClient(app)


# ── Unit Tests ─────────────────────────────────────────────────────────────────

def test_extract_video_id_from_full_url():
    from src.rag.ingestion import extract_video_id
    assert extract_video_id("https://www.youtube.com/watch?v=Gfr50f6ZBvo") == "Gfr50f6ZBvo"


def test_extract_video_id_from_short_url():
    from src.rag.ingestion import extract_video_id
    assert extract_video_id("https://youtu.be/Gfr50f6ZBvo") == "Gfr50f6ZBvo"


def test_extract_video_id_bare():
    from src.rag.ingestion import extract_video_id
    assert extract_video_id("Gfr50f6ZBvo") == "Gfr50f6ZBvo"


def test_extract_video_id_invalid():
    from src.rag.ingestion import extract_video_id
    with pytest.raises(ValueError):
        extract_video_id("not-a-valid-url-or-id")


# ── API Integration Tests (mocked) ────────────────────────────────────────────

MOCK_SENTIMENT = {
    "overall_sentiment": "positive",
    "sentiment_score": 0.75,
    "confidence": 0.9,
    "key_themes": ["AI", "machine learning"],
    "summary": "A great video about AI.",
    "emotional_tone": "enthusiastic",
    "positive_aspects": ["informative"],
    "negative_aspects": [],
}


@patch("api.routes.ingest_video")
@patch("api.routes.build_vector_store")
@patch("api.routes.VideoAnalyzer")
def test_analyze_endpoint(mock_analyzer_cls, mock_build_vs, mock_ingest):
    mock_ingest.return_value = ("transcript text " * 100, [MagicMock()] * 10)
    mock_build_vs.return_value = MagicMock()
    mock_instance = MagicMock()
    mock_instance.analyze_sentiment.return_value = MOCK_SENTIMENT
    mock_analyzer_cls.return_value = mock_instance

    response = client.post("/api/v1/analyze", json={"url": "https://www.youtube.com/watch?v=Gfr50f6ZBvo"})
    assert response.status_code == 200
    data = response.json()
    assert data["video_id"] == "Gfr50f6ZBvo"
    assert "sentiment" in data


def test_analyze_invalid_url():
    response = client.post("/api/v1/analyze", json={"url": "not-a-youtube-url-at-all-bad"})
    assert response.status_code == 400


@patch("api.routes.session_store.load")
def test_chat_video_not_found(mock_load):
    mock_load.return_value = None
    response = client.post("/api/v1/chat", json={"video_id": "nonexistent", "question": "What is this?"})
    assert response.status_code == 404


@patch("api.routes.session_store.load")
def test_chat_success(mock_load):
    mock_analyzer = MagicMock()
    mock_analyzer.ask.return_value = "This video is about AI research."
    mock_load.return_value = mock_analyzer

    response = client.post("/api/v1/chat", json={"video_id": "Gfr50f6ZBvo", "question": "What is this about?"})
    assert response.status_code == 200
    assert response.json()["answer"] == "This video is about AI research."


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

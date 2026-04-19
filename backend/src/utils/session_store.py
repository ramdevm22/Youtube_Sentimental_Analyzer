"""
Simple in-memory store for VideoAnalyzer instances keyed by video_id.
In production, replace with Redis + serialized FAISS index.
"""
from typing import Dict, Optional

_store: Dict[str, object] = {}


def save(video_id: str, analyzer) -> None:
    _store[video_id] = analyzer


def load(video_id: str) -> Optional[object]:
    return _store.get(video_id)


def exists(video_id: str) -> bool:
    return video_id in _store


def clear(video_id: str) -> None:
    _store.pop(video_id, None)

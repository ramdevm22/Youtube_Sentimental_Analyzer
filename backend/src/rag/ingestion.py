from youtube_transcript_api import YouTubeTranscriptApi
from langchain.text_splitter import RecursiveCharacterTextSplitter
from src.config import get_settings
import re


def extract_video_id(url_or_id: str) -> str:
    patterns = [
        r"(?:v=)([a-zA-Z0-9_-]{11})",
        r"(?:youtu\.be/)([a-zA-Z0-9_-]{11})",
        r"(?:embed/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    if re.match(r"^[a-zA-Z0-9_-]{11}$", url_or_id):
        return url_or_id
    raise ValueError(f"Could not extract video ID from: {url_or_id}")


def fetch_transcript(video_id: str) -> tuple:
    try:
        from youtube_transcript_api.proxies import WebshareProxyConfig
        ytt_api = YouTubeTranscriptApi(
            proxy_config=WebshareProxyConfig(
                proxy_username=os.getenv("PROXY_USERNAME", ""),
                proxy_password=os.getenv("PROXY_PASSWORD", ""),
            )
        )
    except Exception:
        ytt_api = YouTubeTranscriptApi()
    
    try:
        transcript_list = ytt_api.fetch(video_id)
        text = " ".join(chunk.text for chunk in transcript_list)
        return text, "english"
    except Exception as e:
        raise ValueError(f"Failed to fetch transcript: {str(e)}")

def split_transcript(transcript: str) -> list:
    settings = get_settings()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    return splitter.create_documents([transcript])


def ingest_video(url_or_id: str) -> tuple:
    """Returns (transcript, chunks, language)"""
    video_id = extract_video_id(url_or_id)
    transcript, language = fetch_transcript(video_id)
    chunks = split_transcript(transcript)
    return transcript, chunks, language
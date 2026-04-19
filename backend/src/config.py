from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM - supports "ollama" or "openai"
    llm_provider: str = "ollama"
    groq_api_key: str = "not-needed"
    groq_model: str = "llama3-8b-8192"

    # Ollama settings (free, local)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_embedding_model: str = "nomic-embed-text"

    # OpenAI settings (paid, cloud) - optional
    openai_api_key: str = "not-needed"
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # RAG settings
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retriever_k: int = 4

    # MLflow (optional)
    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment_name: str = "youtube-sentiment-rag"

    # Derived helpers
    @property
    def openai_model(self) -> str:
        return self.__dict__.get("openai_model", "gpt-4o-mini")

    @property
    def embedding_model(self) -> str:
        if self.llm_provider == "ollama":
            return self.ollama_embedding_model
        return self.openai_embedding_model

    @property
    def chat_model(self) -> str:
        if self.llm_provider == "ollama":
            return self.ollama_model
        return self.__dict__.get("openai_model", "gpt-4o-mini")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

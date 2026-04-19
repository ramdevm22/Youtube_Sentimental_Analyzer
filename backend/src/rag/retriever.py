from langchain_community.vectorstores import FAISS
from langchain_core.vectorstores import VectorStoreRetriever
from src.config import get_settings


def _get_embeddings():
    settings = get_settings()
    if settings.llm_provider == "groq":
        # Groq has no embeddings — use free HuggingFace embeddings
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    elif settings.llm_provider == "ollama":
        from langchain_ollama import OllamaEmbeddings
        return OllamaEmbeddings(model=settings.ollama_embedding_model, base_url=settings.ollama_base_url)
    else:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(model=settings.openai_embedding_model, openai_api_key=settings.openai_api_key)


def build_vector_store(chunks: list) -> FAISS:
    embeddings = _get_embeddings()
    return FAISS.from_documents(chunks, embeddings)


def get_retriever(vector_store: FAISS) -> VectorStoreRetriever:
    settings = get_settings()
    return vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": settings.retriever_k},
    )

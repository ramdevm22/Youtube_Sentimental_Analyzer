from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_core.vectorstores import VectorStoreRetriever
from src.config import get_settings


QA_PROMPT = PromptTemplate(
    template="""You are a helpful assistant analyzing a YouTube video transcript.
The transcript may be in Hindi or English. Understand it in its original language.
Answer ONLY from the provided transcript context.
If the context is insufficient, say you don't know.
Always respond in English regardless of transcript language.

Context:
{context}

Question: {question}

Answer:""",
    input_variables=["context", "question"],
)

SENTIMENT_PROMPT = PromptTemplate(
    template="""You are a sentiment analysis expert. Analyze the overall sentiment of this YouTube video transcript.

The transcript may be in Hindi (Devanagari or Roman) or English. Understand it fully in its original language before analyzing.

Transcript excerpt:
{context}

Detected language: {language}

Provide a JSON response with this exact structure (no extra text, just JSON):
{{
  "overall_sentiment": "positive",
  "sentiment_score": 0.7,
  "confidence": 0.85,
  "language": "{language}",
  "key_themes": ["theme1", "theme2"],
  "summary": "Brief summary in English.",
  "emotional_tone": "enthusiastic",
  "positive_aspects": ["point1"],
  "negative_aspects": []
}}

Rules:
- overall_sentiment must be one of: positive, negative, neutral, mixed
- sentiment_score: float between -1.0 (very negative) and 1.0 (very positive)
- summary must always be written in English even if transcript is Hindi
- key_themes must always be in English
- Return ONLY valid JSON, no markdown, no explanation""",
    input_variables=["context", "language"],
)


def _get_llm(temperature: float = 0.2):
    settings = get_settings()
    if settings.llm_provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=settings.groq_model,
            api_key=settings.groq_api_key,
            temperature=temperature,
        )
    elif settings.llm_provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            temperature=temperature,
        )
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.chat_model,
            temperature=temperature,
            openai_api_key=settings.openai_api_key,
        )


def _format_docs(docs) -> str:
    return "\n\n".join(doc.page_content for doc in docs)


def build_qa_chain(retriever: VectorStoreRetriever):
    llm = _get_llm(temperature=0.2)
    parallel_chain = RunnableParallel({
        "context": retriever | RunnableLambda(_format_docs),
        "question": RunnablePassthrough(),
    })
    return parallel_chain | QA_PROMPT | llm | StrOutputParser()


def build_sentiment_chain(retriever: VectorStoreRetriever):
    llm = _get_llm(temperature=0.0)

    def run_sentiment(transcript_summary: str, language: str = "english"):
        docs = retriever.invoke(
            "overall sentiment themes emotions topics discussed in this video"
        )
        context = _format_docs(docs)
        prompt_value = SENTIMENT_PROMPT.invoke({
            "context": context,
            "language": language,
        })
        return llm.invoke(prompt_value)

    return run_sentiment
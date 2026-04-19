"""
mlops/evaluate.py - Offline RAG pipeline evaluation.
Usage: python mlops/evaluate.py --video_id Gfr50f6ZBvo
"""

import argparse
import json
import time
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.config import get_settings
from src.rag.ingestion import ingest_video
from src.rag.retriever import build_vector_store, get_retriever
from src.rag.chain import build_qa_chain

GOLDEN_QA = [
    {"question": "What is the main topic of this video?", "keywords": ["summary", "topic", "about", "discuss"]},
    {"question": "Can you summarize the key points?", "keywords": ["key", "point", "main", "important"]},
    {"question": "What conclusions are drawn in the video?", "keywords": ["conclusion", "result", "finding", "therefore"]},
]


def evaluate(video_id: str):
    settings = get_settings()

    print(f"Ingesting video: {video_id}")
    transcript, chunks = ingest_video(video_id)
    vector_store = build_vector_store(chunks)
    retriever = get_retriever(vector_store)
    qa_chain = build_qa_chain(retriever)

    results = []
    for qa in GOLDEN_QA:
        start = time.time()
        answer = qa_chain.invoke(qa["question"])
        latency = time.time() - start
        hits = sum(1 for kw in qa["keywords"] if kw in answer.lower())
        relevance = hits / len(qa["keywords"])
        results.append({"question": qa["question"], "answer": answer, "latency_sec": round(latency, 2), "keyword_relevance": round(relevance, 2)})
        print(f"Q: {qa['question']}\nA: {answer[:120]}...\n   latency={latency:.2f}s  relevance={relevance:.2f}\n")

    avg_latency = sum(r["latency_sec"] for r in results) / len(results)
    avg_relevance = sum(r["keyword_relevance"] for r in results) / len(results)

    try:
        import mlflow
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        mlflow.set_experiment(f"{settings.mlflow_experiment_name}-eval")
        with mlflow.start_run(run_name=f"eval-{video_id}"):
            mlflow.log_params({"video_id": video_id, "model": settings.openai_model, "num_chunks": len(chunks)})
            mlflow.log_metrics({"avg_latency_sec": round(avg_latency, 2), "avg_keyword_relevance": round(avg_relevance, 2)})
            mlflow.log_text(json.dumps(results, indent=2), "eval_results.json")
        print("Results logged to MLflow.")
    except Exception:
        print("MLflow not available — skipping tracking.")

    print(f"\nEvaluation complete. Avg latency: {avg_latency:.2f}s | Avg relevance: {avg_relevance:.2f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--video_id", required=True)
    args = parser.parse_args()
    evaluate(args.video_id)

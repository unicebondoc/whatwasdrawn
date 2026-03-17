import os
import json
import logging
from typing import List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

_pinecone_index = None
_embeddings = None
_cards_loaded = False


async def init_pinecone():
    """Initialize Pinecone connection and embed oracle cards if not already done."""
    global _pinecone_index, _embeddings, _cards_loaded

    pinecone_api_key = os.getenv("PINECONE_API_KEY", "")
    pinecone_index_name = os.getenv("PINECONE_INDEX", "what-was-drawn")

    if not pinecone_api_key:
        logger.info("Pinecone not configured — RAG disabled.")
        return

    try:
        from pinecone import Pinecone
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        pc = Pinecone(api_key=pinecone_api_key)

        existing_indexes = [idx.name for idx in pc.list_indexes()]
        if pinecone_index_name not in existing_indexes:
            pc.create_index(
                name=pinecone_index_name,
                dimension=768,
                metric="cosine",
                spec={"serverless": {"cloud": "aws", "region": "us-east-1"}},
            )
            logger.info(f"Created Pinecone index: {pinecone_index_name}")

        _pinecone_index = pc.Index(pinecone_index_name)

        # Optional embeddings provider for RAG. If not configured, we keep Pinecone connected
        # but skip embedding + retrieval without warning (reading still works without RAG).
        embeddings_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if embeddings_api_key:
            _embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=embeddings_api_key,
            )
            await _embed_cards_if_needed()
        else:
            _embeddings = None
            logger.info("Embeddings not configured — Pinecone RAG retrieval disabled.")

    except Exception as e:
        logger.error(f"Pinecone init failed: {e}")
        _pinecone_index = None


async def _embed_cards_if_needed():
    """Embed all oracle cards into Pinecone if not already present."""
    global _cards_loaded

    if _pinecone_index is None or _embeddings is None:
        return

    try:
        stats = _pinecone_index.describe_index_stats()
        if stats.total_vector_count >= 44:
            logger.info("Oracle cards already embedded in Pinecone.")
            _cards_loaded = True
            return

        cards_path = Path(__file__).parent.parent / "data" / "oracle_cards.json"
        with open(cards_path) as f:
            cards = json.load(f)

        vectors = []
        for card in cards:
            text = (
                f"Card: {card['name']}\n"
                f"Keywords: {', '.join(card['keywords'])}\n"
                f"State: {card['state']} | Need: {card['need']} | Invitation: {card['invitation']}\n"
                f"Meaning: {card['meaning']}\n"
                f"Shadow: {card['shadow_aspect']}"
            )
            embedding = _embeddings.embed_query(text)
            vectors.append({
                "id": f"card_{card['id']}",
                "values": embedding,
                "metadata": {
                    "card_id": card["id"],
                    "name": card["name"],
                    "text": text,
                    "keywords": ", ".join(card["keywords"]),
                    "state": card["state"],
                },
            })

        batch_size = 10
        for i in range(0, len(vectors), batch_size):
            _pinecone_index.upsert(vectors=vectors[i:i + batch_size])

        _cards_loaded = True
        logger.info(f"Embedded {len(cards)} oracle cards into Pinecone.")

    except Exception as e:
        logger.error(f"Card embedding failed: {e}")


async def retrieve_context(card_names: List[str]) -> str:
    """Retrieve relevant context for the given card names from Pinecone."""
    if _pinecone_index is None or _embeddings is None:
        return ""

    try:
        query = f"Oracle cards: {', '.join(card_names)}. Provide a mystical reading."
        query_embedding = _embeddings.embed_query(query)

        results = _pinecone_index.query(
            vector=query_embedding,
            top_k=min(len(card_names) * 2, 6),
            include_metadata=True,
        )

        context_parts = []
        for match in results.matches:
            if match.metadata and "text" in match.metadata:
                context_parts.append(match.metadata["text"])

        return "\n\n---\n\n".join(context_parts)

    except Exception as e:
        logger.error(f"Pinecone retrieval failed: {e}")
        return ""


def is_connected() -> bool:
    return _pinecone_index is not None

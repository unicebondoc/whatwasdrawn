import json
import logging
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException

from app.models.schemas import DrawRequest, SelectionRequest, SpreadReading, CardInSpread, OracleCard
from app.services import openai_service, pinecone_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/readings", tags=["readings"])

SPREAD_POSITIONS = {
    "three_card": ["Past", "Present", "Future"],
    "single": ["The Oracle Speaks"],
    "celtic": ["The Heart", "The Cross", "The Foundation", "The Path", "The Crown", "The Outcome"],
}

_cards_cache: List[dict] = []


def _load_cards() -> List[dict]:
    global _cards_cache
    if not _cards_cache:
        cards_path = Path(__file__).parent.parent / "data" / "oracle_cards.json"
        with open(cards_path) as f:
            _cards_cache = json.load(f)
    return _cards_cache


@router.post("/draw", response_model=SpreadReading)
async def draw_spread(request: DrawRequest):
    """Draw cards and generate an AI-powered oracle reading."""
    spread_type = request.spread_type or "three_card"
    positions = SPREAD_POSITIONS.get(spread_type, SPREAD_POSITIONS["three_card"])
    count = len(positions)

    cards = _load_cards()
    selected = random.sample(cards, min(count, len(cards)))

    cards_in_spread = []
    for i, card in enumerate(selected):
        is_reversed = random.random() < 0.3
        cards_in_spread.append(
            CardInSpread(
                position=i,
                position_name=positions[i],
                card=OracleCard(**card, is_reversed=is_reversed),
                is_reversed=is_reversed,
            )
        )

    card_names = [c.card.name for c in cards_in_spread]
    rag_context = await pinecone_service.retrieve_context(card_names)

    cards_for_llm = [
        {
            "card": {
                "name": c.card.name,
                "keywords": c.card.keywords,
                "state": c.card.state,
                "need": c.card.need,
                "invitation": c.card.invitation,
                "meaning": c.card.meaning,
                "shadow_aspect": c.card.shadow_aspect,
                "reflection": c.card.reflection,
            },
            "is_reversed": c.is_reversed,
            "position_name": c.position_name,
        }
        for c in cards_in_spread
    ]

    result = await openai_service.generate_reading(
        cards=cards_for_llm,
        spread_type=spread_type,
        rag_context=rag_context,
    )

    ai_cards = result.get("cards", [])
    for i, c in enumerate(cards_in_spread):
        if i < len(ai_cards):
            c.insight = ai_cards[i].get("insight")

    return SpreadReading(
        spread_type=spread_type,
        cards=cards_in_spread,
        whisper=result.get("whisper"),
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/interpret", response_model=SpreadReading)
async def interpret_specific_cards(request: SelectionRequest):
    """Generate a reading for specific pre-selected cards with orientation."""
    all_cards = _load_cards()
    positions = SPREAD_POSITIONS.get(request.spread_type, SPREAD_POSITIONS["three_card"])

    cards_in_spread = []
    for i, sel in enumerate(request.cards[:len(positions)]):
        card = next((c for c in all_cards if c["id"] == sel.id), None)
        if not card:
            raise HTTPException(status_code=404, detail=f"Card {sel.id} not found")
        cards_in_spread.append(
            CardInSpread(
                position=i,
                position_name=positions[i] if i < len(positions) else f"Card {i+1}",
                card=OracleCard(**card, is_reversed=sel.is_reversed),
                is_reversed=sel.is_reversed,
            )
        )

    card_names = [c.card.name for c in cards_in_spread]
    rag_context = await pinecone_service.retrieve_context(card_names)

    cards_for_llm = [
        {
            "card": {
                "name": c.card.name,
                "keywords": c.card.keywords,
                "state": c.card.state,
                "need": c.card.need,
                "invitation": c.card.invitation,
                "meaning": c.card.meaning,
                "shadow_aspect": c.card.shadow_aspect,
                "reflection": c.card.reflection,
            },
            "is_reversed": c.is_reversed,
            "position_name": c.position_name,
        }
        for c in cards_in_spread
    ]

    try:
        if request.question and request.question.strip():
            logger.info("Interpret: seeker question present (length=%d)", len(request.question.strip()))
        result = await openai_service.generate_reading(
            cards=cards_for_llm,
            spread_type=request.spread_type,
            rag_context=rag_context,
            user_question=request.question,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=str(e) if str(e) else "The oracle could not be reached. Please try again.",
        ) from e

    ai_cards = result.get("cards", [])
    for i, c in enumerate(cards_in_spread):
        if i < len(ai_cards):
            c.insight = ai_cards[i].get("insight")

    return SpreadReading(
        spread_type=request.spread_type,
        cards=cards_in_spread,
        whisper=result.get("whisper"),
        created_at=datetime.now(timezone.utc).isoformat(),
    )

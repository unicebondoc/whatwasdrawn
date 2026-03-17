import json
import random
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException

from app.models.schemas import OracleCard

router = APIRouter(prefix="/api/cards", tags=["cards"])

_cards_cache: List[dict] = []


def _load_cards() -> List[dict]:
    global _cards_cache
    if not _cards_cache:
        cards_path = Path(__file__).parent.parent / "data" / "oracle_cards.json"
        with open(cards_path) as f:
            _cards_cache = json.load(f)
    return _cards_cache


@router.get("/", response_model=List[OracleCard])
async def get_all_cards():
    """Return all 44 oracle cards."""
    return _load_cards()


@router.get("/{card_id}", response_model=OracleCard)
async def get_card(card_id: int):
    """Return a specific oracle card by ID."""
    cards = _load_cards()
    card = next((c for c in cards if c["id"] == card_id), None)
    if not card:
        raise HTTPException(status_code=404, detail=f"Card {card_id} not found")
    return card


@router.get("/random/{count}")
async def get_random_cards(count: int = 3):
    """Return N random cards with random orientation."""
    if count < 1 or count > 10:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 10")

    cards = _load_cards()
    selected = random.sample(cards, min(count, len(cards)))

    return [
        {**card, "is_reversed": random.random() < 0.3}
        for card in selected
    ]

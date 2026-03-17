from pydantic import BaseModel
from typing import List, Optional


class OracleCard(BaseModel):
    id: int
    name: str
    keywords: List[str]
    meaning: str
    shadow_aspect: str
    reflection: str
    working_with: str
    state: str
    need: str
    invitation: str
    is_reversed: Optional[bool] = False


class DrawRequest(BaseModel):
    gesture: Optional[str] = "open_palm"
    spread_type: Optional[str] = "three_card"
    question: Optional[str] = None


class CardSelection(BaseModel):
    id: int
    is_reversed: bool = False


class SelectionRequest(BaseModel):
    cards: List[CardSelection]
    spread_type: str = "three_card"
    question: Optional[str] = None


class CardInSpread(BaseModel):
    position: int
    position_name: str
    card: OracleCard
    is_reversed: bool
    context_chunk: Optional[str] = None
    insight: Optional[str] = None


class SpreadReading(BaseModel):
    spread_type: str
    cards: List[CardInSpread]
    narrative: str = ""
    whisper: Optional[str] = None
    created_at: str


class GestureEvent(BaseModel):
    gesture_type: str
    confidence: float
    hand: str


class HealthResponse(BaseModel):
    status: str
    pinecone_connected: bool
    llm_connected: bool

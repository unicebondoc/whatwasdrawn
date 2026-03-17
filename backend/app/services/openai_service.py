import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Debug only (opt-in): helps verify Railway env injection without leaking full keys.
# Set DEBUG_OPENAI_KEY=true in Railway to enable.
if os.getenv("DEBUG_OPENAI_KEY", "").lower() == "true":
    _k = os.getenv("OPENAI_API_KEY", "")
    print(f"DEBUG KEY LENGTH: {len(_k)}")
    print(f"DEBUG KEY START: {_k[:8] if _k else 'EMPTY'}")

_openai_client = None
_default_model = "gpt-4o-mini"


def init_openai():
    """Initialize the OpenAI client."""
    global _openai_client

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        logger.warning("OPENAI_API_KEY not set — AI readings disabled.")
        return

    try:
        from openai import OpenAI

        _openai_client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_MODEL", "").strip() or _default_model
        logger.info("OpenAI initialised (model: %s).", model)
    except Exception as e:
        logger.error("OpenAI init failed: %s", e)
        _openai_client = None


async def generate_reading(
    cards: List[dict],
    spread_type: str = "three_card",
    rag_context: str = "",
    user_question: Optional[str] = None,
) -> dict:
    """Generate a personalised oracle reading using OpenAI. Returns a dict with 'cards' and 'whisper'."""

    if _openai_client is None:
        logger.error("OpenAI client not initialised (missing OPENAI_API_KEY?) — cannot generate reading.")
        raise RuntimeError(
            "Oracle is not connected. Set OPENAI_API_KEY in .env and restart the backend."
        )

    position_names = {
        "three_card": ["Past", "Present", "Future"],
        "single": ["The Oracle Speaks"],
        "celtic": ["The Heart", "The Cross", "The Foundation", "The Path", "The Crown", "The Outcome"],
    }
    positions = position_names.get(spread_type, ["Card 1", "Card 2", "Card 3"])

    card_blocks = []
    for i, card_data in enumerate(cards[: len(positions)]):
        card = card_data["card"]
        reversed_ = card_data.get("is_reversed", False)
        pos = positions[i]
        meaning = card["shadow_aspect"] if reversed_ else card["meaning"]
        orientation = "Reversed" if reversed_ else "Upright"
        card_blocks.append(
            f"CARD {i+1} — {pos.upper()}: {card['name']} ({orientation})\n"
            f"  Keywords: {', '.join(card.get('keywords', []))}\n"
            f"  Core meaning: {meaning}\n"
            f"  Reflection: {card.get('reflection', '')}\n"
            f"  Invitation: {card.get('invitation', '')}"
        )

    cards_text = "\n\n".join(card_blocks)

    rag_section = f"\nAdditional oracle wisdom:\n{rag_context}\n" if rag_context else ""

    # Build per-card JSON keys for the prompt
    card_json_keys = "\n".join(
        f'    {{"insight": "1-2 sentence concrete insight for {positions[i]} — {cards[i]["card"]["name"]}"}}'
        for i in range(min(len(cards), len(positions)))
    )

    # Build structured card lines for the new prompt format
    card_lines = []
    for i, card_data in enumerate(cards[: len(positions)]):
        card = card_data["card"]
        reversed_ = card_data.get("is_reversed", False)
        pos = positions[i]
        orientation = "Reversed" if reversed_ else "Upright"
        keywords = ", ".join(card.get("keywords", []))
        card_lines.append(f"- {pos}: {card['name']} ({orientation}) — Keywords: {keywords}")
    cards_summary = "\n".join(card_lines)

    seeker_q = user_question.strip() if user_question and user_question.strip() else None
    question_display = seeker_q or ""

    prompt = f"""You are The Quiet Whiskers Oracle — wise, warm, poetic, and deeply intuitive.

The seeker has come with this question on their heart:
'{question_display}'

If no question was provided, open by acknowledging they came seeking clarity without a specific question.

They drew these three cards:
{cards_summary}
{rag_section}

Write a flowing oracle reading in your insights and whisper that:
1. Opens by gently acknowledging their question and what they may be carrying
2. Speaks about the past card and what it reveals
3. Speaks about the present and future cards
4. Closes with one short poetic line in italics (wrap that closing line in *asterisks*)

Rules: Never use bullet points, headers, or labels. Write as flowing prose. Warm, poetic, not clinical. Reference actual card names naturally. Maximum 300 words.

Respond ONLY in valid JSON:
{{
  "cards": [
    {{"position": "past", "insight": "2-3 sentences MAXIMUM"}},
    {{"position": "present", "insight": "2-3 sentences MAXIMUM"}},
    {{"position": "future", "insight": "2-3 sentences MAXIMUM"}}
  ],
  "whisper": "MIN 3 paragraphs, MAX 350 words. Paragraph 1 must reference the seeker's question. Must naturally mention all three card names. Final line: a specific poetic line tied to their situation (wrap that final line in *asterisks*)."
}}

RULES:
- Each insight: EXACTLY 2-3 sentences. No more.
- Address the seeker's question specifically.
- If reversed, address the blocked or internalized energy.
- The whisper synthesizes all three cards into ONE cohesive takeaway.
- Tone: gentle, wise, warm. Like a kind cat friend. Not mystical jargon.
- ONLY output valid JSON, nothing else."""

    model = os.getenv("OPENAI_MODEL", "").strip() or _default_model

    system_question = (
        f"The seeker came with this question: '{seeker_q}'\n\n"
        "Speak directly to this question through the cards. Do not give a generic reading.\n"
        "Reference their specific concern naturally throughout the narrative.\n"
        if seeker_q
        else "The seeker came without a specific question, seeking open guidance.\n"
    )
    system_msg = (
        "You are The Quiet Whiskers Oracle.\n\n"
        f"{system_question}\n"
        "Return ONLY valid JSON with keys: 'cards' (array of {position, insight}) and 'whisper' (string). "
        "No markdown, no extra keys. "
        "Each card insight must be exactly 2–3 sentences. "
        "The whisper must be MIN 3 paragraphs and MAX 350 words."
    )

    try:
        import json as _json
        response = _openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt},
            ],
            max_tokens=650,
            temperature=0.6,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content if response.choices else None
        if not text or not text.strip():
            logger.warning("OpenAI returned empty response")
            raise RuntimeError("OpenAI returned an empty reading. Please try again.")

        result = _json.loads(text)
        if "cards" not in result or "whisper" not in result:
            logger.warning("OpenAI JSON missing expected keys: %s", list(result.keys()))
            raise RuntimeError("Oracle returned an unexpected format. Please try again.")

        return result
    except RuntimeError:
        raise
    except Exception as e:
        err_str = str(e).lower()
        if "429" in err_str or "rate" in err_str or "quota" in err_str:
            logger.warning("OpenAI rate limit: %s", e)
            raise RuntimeError("Rate limit exceeded. Please wait a moment and try again.") from e
        if "401" in err_str or "invalid_api_key" in err_str or "authentication" in err_str:
            logger.warning("OpenAI auth error: %s", e)
            raise RuntimeError("Invalid or missing OpenAI API key. Check OPENAI_API_KEY in .env.") from e
        logger.exception("OpenAI generation failed")
        raise RuntimeError(f"OpenAI API error: {e!s}") from e


def is_connected() -> bool:
    return _openai_client is not None

import logging
import tempfile
from pathlib import Path

import speech_recognition as sr
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/speech", tags=["speech"])


class TranscribeResponse(BaseModel):
    text: str


def _audio_to_wav(upload_path: Path, wav_path: Path) -> None:
    """Convert uploaded audio (e.g. webm) to WAV using pydub."""
    from pydub import AudioSegment

    seg = AudioSegment.from_file(str(upload_path))
    seg.export(str(wav_path), format="wav")


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(audio: UploadFile = File(..., description="Audio file (e.g. webm, wav)")):
    """Transcribe audio to text using Google Speech Recognition (free, no API key)."""
    if not audio.content_type and not audio.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")

    suffix = Path(audio.filename or "audio").suffix.lower() or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        try:
            content = await audio.read()
            tmp.write(content)
            tmp.flush()
            upload_path = Path(tmp.name)
        except Exception as e:
            logger.exception("Failed to save upload")
            raise HTTPException(status_code=400, detail=f"Invalid audio upload: {e}") from e

    wav_path = upload_path.with_suffix(".wav")
    try:
        if upload_path.suffix.lower() != ".wav":
            _audio_to_wav(upload_path, wav_path)
        else:
            wav_path = upload_path

        recognizer = sr.Recognizer()
        with sr.AudioFile(str(wav_path)) as source:
            audio_data = recognizer.record(source)

        text = recognizer.recognize_google(audio_data, language="en-US")
        return TranscribeResponse(text=text.strip() if text else "")
    except sr.UnknownValueError:
        logger.info("Speech not understood")
        return TranscribeResponse(text="")
    except sr.RequestError as e:
        logger.warning("Google Speech API request failed: %s", e)
        raise HTTPException(status_code=502, detail="Speech recognition service unavailable") from e
    except Exception as e:
        logger.exception("Transcription failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}") from e
    finally:
        upload_path.unlink(missing_ok=True)
        if wav_path != upload_path:
            wav_path.unlink(missing_ok=True)

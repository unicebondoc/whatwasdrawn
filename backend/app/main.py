import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.services import openai_service, pinecone_service
from app.models.schemas import HealthResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting What Was Drawn backend...")
    openai_service.init_openai()
    await pinecone_service.init_pinecone()
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="What Was Drawn API",
    description="Gesture-based AI oracle card reading platform — Quiet Whiskers Oracle",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

from app.routers import cards, readings, speech  # imported after limiter to avoid circular imports
app.include_router(cards.router)
app.include_router(readings.router)
app.include_router(speech.router)


@app.get("/", tags=["root"])
async def root():
    return {
        "message": "What Was Drawn — Quiet Whiskers Oracle API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health():
    return HealthResponse(
        status="ok",
        pinecone_connected=pinecone_service.is_connected(),
        llm_connected=openai_service.is_connected(),
    )

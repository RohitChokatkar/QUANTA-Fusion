"""
QuantFusion v2.0 — FastAPI Entry Point
Python model computation + data backend server.
Serves WebSocket + REST endpoints to the React frontend.
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.routes import router as api_router
from api.websocket import router as ws_router
from services.data_manager import DataManager
from auto_refresh import refresh_from_env, apply_token_to_client

# ── Logging ──────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if os.getenv("DEBUG", "false").lower() == "true" else logging.INFO,
    format="%(asctime)s │ %(name)-20s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("quantfusion")

# ── Shared state ─────────────────────────────────────
data_manager = DataManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    logger.info("🚀 QuantFusion v2.0 backend starting…")

    # Load token from env var at startup
    refresh_from_env()

    await data_manager.start()
    app.state.data_manager = data_manager

    # Apply token to Fyers clients after DataManager starts
    apply_token_to_client(data_manager)

    yield
    logger.info("🛑 QuantFusion v2.0 backend shutting down…")
    await data_manager.stop()


# ── App ──────────────────────────────────────────────
app = FastAPI(
    title="QuantFusion v2.0 API",
    description="10 quant models on BSE live data — Python backend",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS — allow production frontend + local dev ─────
ALLOWED_ORIGINS = [
    "https://quanta-fusion.web.app",
    "https://quanta-fusion.firebaseapp.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "name": "QuantFusion v2.0",
        "status": "running",
        "models": 10,
        "market": "BSE",
        "currency": "INR",
    }


@app.get("/health")
async def health():
    from token_manager import get_token_info
    return {
        "status": "ok",
        "token": get_token_info(),
    }


# ── Run ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )

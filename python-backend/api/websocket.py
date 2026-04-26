"""
FastAPI WebSocket routes — Live tick + model output streaming.
"""

import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/live")
async def ws_live(websocket: WebSocket):
    """Stream live BSE ticks + model updates to React frontend."""
    await websocket.accept()
    dm = websocket.app.state.data_manager
    queue = dm.subscribe_ws()

    try:
        # Send initial state
        await websocket.send_json({
            "type": "init",
            "data": {
                "symbol": dm._active_symbol,
                "quote": dm.latest_quote,
                "models": dm.outputs,
                "ohlcv": dm.ohlcv[-100:] if dm.ohlcv else [],
            },
        })

        while True:
            try:
                msg = await asyncio.wait_for(queue.get(), timeout=30)
                await websocket.send_json(msg)
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"type": "heartbeat"})
            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        dm.unsubscribe_ws(queue)


@router.websocket("/ws/models")
async def ws_models(websocket: WebSocket):
    """Stream model output updates only."""
    await websocket.accept()
    dm = websocket.app.state.data_manager
    queue = dm.subscribe_ws()

    try:
        while True:
            try:
                msg = await asyncio.wait_for(queue.get(), timeout=30)
                if msg.get("type") == "models":
                    await websocket.send_json(msg)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "heartbeat"})
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    finally:
        dm.unsubscribe_ws(queue)

@router.websocket("/ws/forex")
async def ws_forex(websocket: WebSocket):
    """Stream live spot forex rates to React frontend."""
    await websocket.accept()
    dm = websocket.app.state.data_manager
    queue = dm.td_client.subscribe_ws()

    try:
        # Send initial rates
        rates = await dm.td_client.get_live_rates()
        if rates:
            for rate in rates.values():
                await websocket.send_json({
                    "type": "forex_tick",
                    "data": rate
                })

        while True:
            try:
                msg = await asyncio.wait_for(queue.get(), timeout=30)
                await websocket.send_json(msg)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "heartbeat"})
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    finally:
        dm.td_client.unsubscribe_ws(queue)

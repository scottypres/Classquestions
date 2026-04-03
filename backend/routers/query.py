import asyncio
import json
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from models import QueryRequest
from services.anthropic_service import AnthropicService
from services.openai_service import OpenAIService
from services.gemini_service import GeminiService
import aiosqlite
from config import DATABASE_PATH

router = APIRouter()

anthropic_svc = AnthropicService()
openai_svc = OpenAIService()
gemini_svc = GeminiService()

PROVIDER_MAP = {
    "gemini": gemini_svc,
    "claude": anthropic_svc,
    "chatgpt": openai_svc,
}

CLASS_QUESTIONS_PREFIX = (
    "IMPORTANT: Start your response with ONLY the letter or number answer on the first line "
    "(e.g., 'A' or '3' or 'B' — just the letter/number, nothing else). "
    "Then leave a blank line and provide your full detailed explanation.\n\n"
)


@router.post("/query")
async def query_llms(req: QueryRequest, request: Request):
    # Resolve file metadata if file_ids provided
    files_by_id = {}
    if req.file_ids:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            db.row_factory = aiosqlite.Row
            placeholders = ",".join("?" for _ in req.file_ids)
            cursor = await db.execute(
                f"SELECT id, filename, mime_type, file_path FROM uploads WHERE id IN ({placeholders})",
                req.file_ids,
            )
            rows = await cursor.fetchall()
            files_by_id = {row["id"]: dict(row) for row in rows}

    files_list = [files_by_id[fid] for fid in req.file_ids if fid in files_by_id]

    prompt = req.prompt
    if req.class_questions_mode:
        prompt = CLASS_QUESTIONS_PREFIX + prompt

    async def event_generator():
        queue = asyncio.Queue()

        async def stream_provider(provider: str):
            svc = PROVIDER_MAP.get(provider)
            if not svc:
                await queue.put(json.dumps({
                    "provider": provider, "type": "error",
                    "content": f"Unknown provider: {provider}"
                }))
                return
            model = req.models.get(provider, None)
            try:
                async for token in svc.stream_response(prompt, model, files_list):
                    await queue.put(json.dumps({
                        "provider": provider, "type": "token", "content": token
                    }))
                await queue.put(json.dumps({
                    "provider": provider, "type": "done", "content": ""
                }))
            except Exception as e:
                await queue.put(json.dumps({
                    "provider": provider, "type": "error",
                    "content": str(e)
                }))

        tasks = []
        for provider in req.providers:
            tasks.append(asyncio.create_task(stream_provider(provider)))

        async def wait_all():
            await asyncio.gather(*tasks)
            await queue.put(None)  # sentinel

        asyncio.create_task(wait_all())

        while True:
            if await request.is_disconnected():
                for t in tasks:
                    t.cancel()
                break
            item = await queue.get()
            if item is None:
                break
            yield {"data": item}

    return EventSourceResponse(event_generator())

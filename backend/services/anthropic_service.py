import anthropic
import base64
from typing import AsyncGenerator
from config import ANTHROPIC_API_KEY
from services.llm_base import LLMService

DEFAULT_MODEL = "claude-sonnet-4-20250514"


class AnthropicService(LLMService):
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

    async def stream_response(
        self, prompt: str, model: str = None, files: list[dict] = None
    ) -> AsyncGenerator[str, None]:
        if not self.client:
            yield "[Error: ANTHROPIC_API_KEY not configured]"
            return

        model = model or DEFAULT_MODEL
        messages_content = []

        if files:
            for f in files:
                if f.get("mime_type", "").startswith("image/"):
                    with open(f["file_path"], "rb") as fh:
                        data = base64.b64encode(fh.read()).decode("utf-8")
                    messages_content.append({
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": f["mime_type"],
                            "data": data,
                        },
                    })
                else:
                    with open(f["file_path"], "r", errors="replace") as fh:
                        content = fh.read()
                    messages_content.append({
                        "type": "text",
                        "text": f"[File: {f['filename']}]\n{content}",
                    })

        messages_content.append({"type": "text", "text": prompt})

        try:
            async with self.client.messages.stream(
                model=model,
                max_tokens=8192,
                messages=[{"role": "user", "content": messages_content}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as e:
            yield f"\n\n[Error from Claude: {str(e)}]"

    async def list_models(self) -> list[dict]:
        if not self.client:
            return []
        try:
            response = await self.client.models.list(limit=100)
            models = []
            for m in response.data:
                models.append({"id": m.id, "name": m.display_name or m.id})
            return sorted(models, key=lambda x: x["name"])
        except Exception:
            return [
                {"id": "claude-opus-4-20250514", "name": "Claude Opus 4"},
                {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4"},
                {"id": "claude-haiku-4-20250514", "name": "Claude Haiku 4"},
            ]

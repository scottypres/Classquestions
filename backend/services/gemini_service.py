from typing import AsyncGenerator
from services.llm_base import LLMService

DEFAULT_MODEL = "gemini-2.5-flash-preview-05-20"


class GeminiService(LLMService):
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from config import GOOGLE_API_KEY
            if GOOGLE_API_KEY:
                from google import genai
                self._client = genai.Client(api_key=GOOGLE_API_KEY)
        return self._client

    async def stream_response(
        self, prompt: str, model: str = None, files: list[dict] = None
    ) -> AsyncGenerator[str, None]:
        client = self._get_client()
        if not client:
            yield "[Error: GOOGLE_API_KEY not configured]"
            return

        from google.genai import types
        model = model or DEFAULT_MODEL
        contents = []

        if files:
            for f in files:
                if f.get("mime_type", "").startswith("image/"):
                    with open(f["file_path"], "rb") as fh:
                        data = fh.read()
                    contents.append(types.Part.from_bytes(data=data, mime_type=f["mime_type"]))
                else:
                    with open(f["file_path"], "r", errors="replace") as fh:
                        content = fh.read()
                    contents.append(types.Part.from_text(text=f"[File: {f['filename']}]\n{content}"))

        contents.append(types.Part.from_text(text=prompt))

        try:
            stream = await client.aio.models.generate_content_stream(
                model=model,
                contents=contents,
            )
            async for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"\n\n[Error from Gemini: {str(e)}]"

    async def list_models(self) -> list[dict]:
        client = self._get_client()
        if not client:
            return []
        try:
            models = []
            async for m in client.aio.models.list():
                if "gemini" in m.name.lower():
                    display = m.display_name or m.name.split("/")[-1]
                    model_id = m.name.split("/")[-1] if "/" in m.name else m.name
                    models.append({"id": model_id, "name": display})
            return sorted(models, key=lambda x: x["name"])
        except Exception:
            return [
                {"id": "gemini-2.5-flash-preview-05-20", "name": "Gemini 2.5 Flash"},
                {"id": "gemini-2.5-pro-preview-05-06", "name": "Gemini 2.5 Pro"},
            ]

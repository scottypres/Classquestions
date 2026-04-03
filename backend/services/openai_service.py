import base64
from typing import AsyncGenerator
from services.llm_base import LLMService

DEFAULT_MODEL = "gpt-4o"


class OpenAIService(LLMService):
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from config import OPENAI_API_KEY
            if OPENAI_API_KEY:
                import openai
                self._client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
        return self._client

    async def stream_response(
        self, prompt: str, model: str = None, files: list[dict] = None
    ) -> AsyncGenerator[str, None]:
        client = self._get_client()
        if not client:
            yield "[Error: OPENAI_API_KEY not configured]"
            return

        model = model or DEFAULT_MODEL
        messages_content = []

        if files:
            for f in files:
                if f.get("mime_type", "").startswith("image/"):
                    with open(f["file_path"], "rb") as fh:
                        data = base64.b64encode(fh.read()).decode("utf-8")
                    messages_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{f['mime_type']};base64,{data}"
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
            stream = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": messages_content}],
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n\n[Error from ChatGPT: {str(e)}]"

    async def list_models(self) -> list[dict]:
        client = self._get_client()
        if not client:
            return []
        try:
            response = await client.models.list()
            models = []
            for m in response.data:
                if any(prefix in m.id for prefix in ["gpt-4", "gpt-3.5", "o1", "o3", "o4"]):
                    models.append({"id": m.id, "name": m.id})
            return sorted(models, key=lambda x: x["name"])
        except Exception:
            return [
                {"id": "gpt-4o", "name": "gpt-4o"},
                {"id": "gpt-4o-mini", "name": "gpt-4o-mini"},
                {"id": "gpt-4-turbo", "name": "gpt-4-turbo"},
            ]

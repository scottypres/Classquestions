from fastapi import APIRouter
from services.anthropic_service import AnthropicService
from services.openai_service import OpenAIService
from services.gemini_service import GeminiService

router = APIRouter()

services = {
    "gemini": GeminiService(),
    "claude": AnthropicService(),
    "chatgpt": OpenAIService(),
}


@router.get("/models/{provider}")
async def get_models(provider: str):
    svc = services.get(provider)
    if not svc:
        return {"error": f"Unknown provider: {provider}", "models": []}
    models = await svc.list_models()
    return {"provider": provider, "models": models}

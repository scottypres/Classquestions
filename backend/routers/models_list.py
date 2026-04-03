from fastapi import APIRouter
from routers.query import PROVIDER_MAP

router = APIRouter()


@router.get("/models/{provider}")
async def get_models(provider: str):
    svc = PROVIDER_MAP.get(provider)
    if not svc:
        return {"error": f"Unknown provider: {provider}", "models": []}
    models = await svc.list_models()
    return {"provider": provider, "models": models}

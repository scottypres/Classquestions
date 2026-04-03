import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from database import init_db
        await init_db()
    except Exception as e:
        print(f"DB init warning: {e}")
    yield


app = FastAPI(title="ClassQuestions API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print(f"Unhandled error: {tb}")
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "traceback": tb},
    )


# Import routers with error handling
try:
    from routers import query, chat, models_list, upload
    app.include_router(query.router, prefix="/api")
    app.include_router(chat.router, prefix="/api")
    app.include_router(models_list.router, prefix="/api")
    app.include_router(upload.router, prefix="/api")
except Exception as e:
    print(f"Router import error: {e}")
    traceback.print_exc()


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/debug")
async def debug():
    """Debug endpoint to check what's working."""
    import sys
    import os
    results = {}
    results["python_version"] = sys.version
    results["cwd"] = os.getcwd()
    results["env_keys"] = {
        "ANTHROPIC_API_KEY": bool(os.getenv("ANTHROPIC_API_KEY")),
        "OPENAI_API_KEY": bool(os.getenv("OPENAI_API_KEY")),
        "GOOGLE_API_KEY": bool(os.getenv("GOOGLE_API_KEY")),
        "VERCEL": os.getenv("VERCEL", ""),
    }
    results["tmp_writable"] = os.access("/tmp", os.W_OK)

    for mod in ["anthropic", "openai", "google.genai", "aiosqlite", "sse_starlette"]:
        try:
            __import__(mod)
            results[f"import_{mod}"] = "ok"
        except Exception as e:
            results[f"import_{mod}"] = str(e)

    return results

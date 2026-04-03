from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import query, chat, models_list, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="ClassQuestions API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(models_list.router, prefix="/api")
app.include_router(upload.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}

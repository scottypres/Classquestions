from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import init_db
from config import UPLOAD_DIR
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

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(query.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(models_list.router, prefix="/api")
app.include_router(upload.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}

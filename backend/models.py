from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QueryRequest(BaseModel):
    prompt: str
    providers: list[str] = ["gemini", "claude", "chatgpt"]
    models: dict[str, str] = {}
    file_ids: list[str] = []
    chat_id: Optional[str] = None
    class_questions_mode: bool = False


class ChatCreate(BaseModel):
    name: str = "New Chat"


class ChatRename(BaseModel):
    name: str


class MessageCreate(BaseModel):
    role: str
    provider: Optional[str] = None
    content: str
    model: Optional[str] = None


class ChatResponse(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str


class MessageResponse(BaseModel):
    id: str
    chat_id: str
    role: str
    provider: Optional[str]
    content: str
    model: Optional[str]
    created_at: str


class UploadResponse(BaseModel):
    id: str
    filename: str
    mime_type: str

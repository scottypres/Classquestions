import uuid
import os
import aiofiles
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Depends
import aiosqlite
from database import get_db
from config import UPLOAD_DIR

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    chat_id: str = None,
    db: aiosqlite.Connection = Depends(get_db),
):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "file")[1]
    stored_name = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    now = datetime.utcnow().isoformat()
    await db.execute(
        "INSERT INTO uploads (id, chat_id, filename, mime_type, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (file_id, chat_id, file.filename, file.content_type or "application/octet-stream", file_path, now),
    )
    await db.commit()

    return {"id": file_id, "filename": file.filename, "mime_type": file.content_type}

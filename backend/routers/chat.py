import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from database import get_db
from models import ChatCreate, ChatRename, MessageCreate

router = APIRouter()


@router.get("/chats")
async def list_chats(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, name, created_at, updated_at FROM chats ORDER BY updated_at DESC"
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


@router.post("/chats")
async def create_chat(body: ChatCreate, db: aiosqlite.Connection = Depends(get_db)):
    chat_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    await db.execute(
        "INSERT INTO chats (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
        (chat_id, body.name, now, now),
    )
    await db.commit()
    return {"id": chat_id, "name": body.name, "created_at": now, "updated_at": now}


@router.get("/chats/{chat_id}")
async def get_chat(chat_id: str, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT * FROM chats WHERE id = ?", (chat_id,))
    chat = await cursor.fetchone()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    cursor = await db.execute(
        "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
        (chat_id,),
    )
    messages = await cursor.fetchall()
    return {"chat": dict(chat), "messages": [dict(m) for m in messages]}


@router.put("/chats/{chat_id}")
async def rename_chat(
    chat_id: str, body: ChatRename, db: aiosqlite.Connection = Depends(get_db)
):
    now = datetime.utcnow().isoformat()
    result = await db.execute(
        "UPDATE chats SET name = ?, updated_at = ? WHERE id = ?",
        (body.name, now, chat_id),
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    await db.commit()
    return {"id": chat_id, "name": body.name}


@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str, db: aiosqlite.Connection = Depends(get_db)):
    result = await db.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    await db.commit()
    return {"ok": True}


@router.post("/chats/{chat_id}/messages")
async def add_messages(
    chat_id: str,
    body: list[MessageCreate],
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute("SELECT id FROM chats WHERE id = ?", (chat_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Chat not found")

    now = datetime.utcnow().isoformat()
    created = []
    for msg in body:
        msg_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO messages (id, chat_id, role, provider, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (msg_id, chat_id, msg.role, msg.provider, msg.content, msg.model, now),
        )
        created.append({"id": msg_id, **msg.model_dump()})

    await db.execute(
        "UPDATE chats SET updated_at = ? WHERE id = ?", (now, chat_id)
    )
    await db.commit()
    return created

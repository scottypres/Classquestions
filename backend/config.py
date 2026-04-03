import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Use /tmp on Vercel (serverless has writable /tmp only)
_is_vercel = os.getenv("VERCEL", "")
_base = "/tmp" if _is_vercel else os.path.dirname(__file__)

DATABASE_PATH = os.path.join(_base, "classquestions.db")
UPLOAD_DIR = os.path.join(_base, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

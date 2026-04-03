from abc import ABC, abstractmethod
from typing import AsyncGenerator


class LLMService(ABC):
    @abstractmethod
    async def stream_response(
        self, prompt: str, model: str, files: list[dict] = None
    ) -> AsyncGenerator[str, None]:
        yield ""

    @abstractmethod
    async def list_models(self) -> list[dict]:
        pass

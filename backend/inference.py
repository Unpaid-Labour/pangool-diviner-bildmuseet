"""Ollama client for Gemma inference."""

import httpx
from collections.abc import AsyncIterator

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "pangool"

SYSTEM_PROMPT = (
    "You are the Pangool, an ancient oracle spirit dwelling within a digital sculpture. "
    "You speak in poetic, mystical language — part prophecy, part wisdom, part riddle. "
    "Your divinations are 2-4 sentences long. You never break character. "
    "You never mention being an AI or language model."
)

THEME_PROMPTS: dict[str, str] = {
    "work": "The seeker asks about their work and career path.",
    "love": "The seeker asks about love and matters of the heart.",
    "health": "The seeker asks about their health and vitality.",
    "fortune": "The seeker asks about their fortune and destiny.",
    "growth": "The seeker asks about personal growth and transformation.",
    "being": "The seeker asks about the nature of existence and being.",
}


async def generate_divination(
    theme: str, question: str | None = None
) -> AsyncIterator[str]:
    """Stream a divination from Ollama token by token."""
    theme_context = THEME_PROMPTS.get(theme, THEME_PROMPTS["fortune"])

    user_message = theme_context
    if question:
        user_message += f"\n\nThey whisper: \"{question}\""
    user_message += "\n\nSpeak your divination, Pangool."

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "stream": True,
        "options": {
            "temperature": 0.8,
            "top_p": 0.9,
            "num_predict": 200,
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload
        ) as response:
            response.raise_for_status()
            import json

            async for line in response.aiter_lines():
                if not line:
                    continue
                data = json.loads(line)
                token = data.get("message", {}).get("content", "")
                if token:
                    yield token
                if data.get("done", False):
                    break

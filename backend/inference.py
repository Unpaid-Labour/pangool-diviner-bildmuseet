"""Ollama client for Pangool fine-tuned model inference."""

import json
import random

import httpx
from collections.abc import AsyncIterator

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "pangool"

# Each iPad domain maps to a pool of single-word themes from the training data.
# The Modelfile bakes in the system prompt and Gemma chat template, so we only
# need to send one theme word per request via /api/generate.
THEME_POOLS: dict[str, list[str]] = {
    "work": [
        "Work", "Skill", "Persistence", "Opportunity", "Trade",
        "Wealth", "Poverty", "Harvest", "Debt", "Leadership",
        "Labor", "Ambition", "Craft", "Duty", "Effort",
    ],
    "love": [
        "Love", "Marriage", "Family", "Loyalty", "Betrayal",
        "Friendship", "Forgiveness", "Jealousy", "Children", "Trust",
        "Desire", "Devotion", "Heartbreak", "Kinship", "Union",
    ],
    "health": [
        "Health", "Sickness", "Healing", "Pain", "Strength",
        "Endurance", "Mortality", "Aging", "Birth", "Survival",
        "Vitality", "Rest", "Breath", "Nourishment", "Remedy",
    ],
    "fortune": [
        "Fortune", "Destiny", "Fate", "Luck", "Wealth",
        "Abundance", "Famine", "Stars", "Dreams", "Consequences",
        "Prosperity", "Scarcity", "Chance", "Providence", "Reward",
    ],
    "growth": [
        "Wisdom", "Learning", "Knowledge", "Teaching", "Experience",
        "Patience", "Perseverance", "Courage", "Truth", "Identity",
        "Humility", "Curiosity", "Discipline", "Insight", "Mastery",
    ],
    "being": [
        "Life", "Death", "Ancestors", "Silence", "Solitude",
        "Community", "Exile", "Wandering", "Home", "Tradition",
        "Spirit", "Memory", "Belonging", "Journey", "Ritual",
    ],
}


async def generate_divination(
    theme: str, question: str | None = None
) -> AsyncIterator[str]:
    """Stream a single proverb from the fine-tuned Pangool model.

    Picks a random training theme from the pool matching the iPad domain,
    then calls Ollama's /api/generate endpoint. The Modelfile handles the
    system prompt and Gemma chat template, so we only send the theme word.

    Args:
        theme: iPad domain key (work, love, health, fortune, growth, being).
        question: Unused — kept for API compatibility with main.py.

    Yields:
        Individual characters for the frontend's SSE typewriter effect.
    """
    pool = THEME_POOLS.get(theme, THEME_POOLS["fortune"])
    prompt_theme = random.choice(pool)

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt_theme,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST", f"{OLLAMA_BASE_URL}/api/generate", json=payload
        ) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if not line:
                    continue
                data = json.loads(line)
                token = data.get("response", "")
                # Filter out special tokens leaking from the model
                # Filter all Gemma special/template tokens
                for special in (
                    "<bos>", "<eos>",
                    "<start_of_turn>", "<end_of_turn>",
                    "model", "user",
                ):
                    token = token.replace(special, "")
                if token:
                    # Yield character-by-character for smooth typewriter effect
                    for char in token:
                        yield char
                if data.get("done", False):
                    break

"""Ollama client for Pangool fine-tuned model inference."""

import json
import random
import re

import httpx
from collections.abc import AsyncIterator

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "pangool"

# Sent with every request, overriding the baked Modelfile params. Ollama
# runtimes newer than ~April 2026 sample tail tokens the launch runtime never
# surfaced (random foreign-script words mid-proverb); min_p prunes them, and
# repeat_penalty 1.15 breaks the single-word loops observed at 1.05.
GENERATION_OPTIONS = {
    "min_p": 0.08,
    "top_k": 40,
    "repeat_penalty": 1.15,
    # Replaces the baked stop list, so the Gemma tokens must be repeated.
    # "\n" is new: a nax is a single line, and post-proverb junk usually
    # starts on a fresh one.
    "stop": ["<end_of_turn>", "<start_of_turn>", "<bos>", "<eos>", "\n"],
}

# System word list for junk detection in sanitize_divination. Membership is
# checked leniently (plurals, possessives); an unreadable file disables the
# check rather than the whole sanitizer.
try:
    with open("/usr/share/dict/words") as _f:
        _DICT_WORDS = {w.strip().lower() for w in _f}
except OSError:
    _DICT_WORDS = set()


def _known_word(word: str) -> bool:
    w = word.lower().strip("'\".,;:!?-")
    if not w or w.isdigit() or not _DICT_WORDS:
        return True
    candidates = {w, w.rstrip("s"), w.replace("'s", ""), w.replace("'", "")}
    if w.endswith("es"):
        candidates.add(w[:-2])
    return any(c in _DICT_WORDS for c in candidates)

# Typographic characters the model legitimately produces, mapped to ASCII so
# the non-ASCII strip below doesn't eat them.
_UNICODE_PUNCT = {
    "‘": "'",
    "’": "'",
    "“": '"',
    "”": '"',
    "–": "-",
    "—": "-",
    "…": "...",
}


def sanitize_divination(text: str) -> str:
    """Reduce a raw generation to just the proverb.

    Newer Ollama runtimes no longer terminate on the fine-tune's
    <end_of_turn> token, so generations run past the proverb into template
    fragments, literal "\\n" escapes, and stray non-Latin tokens until they
    hit num_predict. Keep everything through the last complete sentence and
    drop the rest.
    """
    # Whole angle-bracket tags and literal "\n" escapes are removed (not
    # cut at) so a proverb that continues after them survives intact.
    text = re.sub(r"<[^<>]*>", " ", text)
    text = text.replace("\\n", " ")
    for src, dst in _UNICODE_PUNCT.items():
        text = text.replace(src, dst)
    text = text.encode("ascii", "ignore").decode()
    text = re.sub(r"\s+", " ", text)
    # Six months of clean output use only letters, digits, space, and
    # . ' , " ; : — so the first character outside that set marks where
    # the proverb ends and the junk tail begins.
    m = re.search(r"[^A-Za-z0-9 .',\";:!?-]", text)
    if m:
        text = text[: m.start()]
    # A run of adjacent punctuation is also junk; keep its leading char
    # if that char legitimately ends the sentence.
    m = re.search(r"[.,;:!?-] ?[.,;:!?-]", text)
    if m:
        keep = m.start() + 1 if text[m.start()] in ".!?" else m.start()
        text = text[:keep]
    # A word repeated 3+ times back-to-back means the model derailed into a
    # loop ("ujednoznacz ujednoznacz ..."); keep one copy, drop the rest.
    m = re.search(r"\b(\w+)(?: \1\b){2,}", text, re.IGNORECASE)
    if m:
        text = text[: m.start() + len(m.group(1))]
    # Cut after the last complete sentence; if the generation was cut off
    # mid-sentence by num_predict, trim trailing junk chars and then any
    # trailing words that aren't English (Latin-alphabet junk tokens).
    m = re.match(r".*[.!?]\"?", text)
    if m:
        text = m.group(0)
    else:
        text = re.sub(r"[^A-Za-z0-9'\"\s]+$", "", text)
        parts = text.split()
        strips = 0
        while parts and strips < 4 and not _known_word(parts[-1]):
            parts.pop()
            strips += 1
        text = " ".join(parts)
    return text.strip()


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
        "options": GENERATION_OPTIONS,
    }

    # Buffer the whole generation before sanitizing: junk tokens arrive
    # split across stream chunks, so per-chunk filtering can't catch them.
    # The ThinkingPage animation covers the few seconds this adds. The "\n"
    # stop can rarely end a generation immediately, so retry a too-short
    # result once before giving up.
    text = ""
    async with httpx.AsyncClient(timeout=120.0) as client:
        for _attempt in range(2):
            chunks: list[str] = []
            async with client.stream(
                "POST", f"{OLLAMA_BASE_URL}/api/generate", json=payload
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    chunks.append(data.get("response", ""))
                    if data.get("done", False):
                        break

            text = sanitize_divination("".join(chunks))
            if len(text) >= 10:
                break

    # Yield character-by-character for smooth typewriter effect
    for char in text or "The spirits are silent.":
        yield char

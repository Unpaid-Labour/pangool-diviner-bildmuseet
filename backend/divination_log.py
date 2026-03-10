"""CSV logger for divination sessions.

Appends one row per completed divination to `data/divinations.csv`.
"""

import csv
import logging
from datetime import datetime
from pathlib import Path

logger = logging.getLogger("pangool.log")

LOG_DIR = Path(__file__).parent / "data"
LOG_FILE = LOG_DIR / "divinations.csv"
FIELDNAMES = ["timestamp", "theme", "question", "divination"]


def _ensure_file():
    """Create the CSV with a header row if it doesn't exist yet."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    if not LOG_FILE.exists():
        with open(LOG_FILE, "w", newline="") as f:
            csv.DictWriter(f, fieldnames=FIELDNAMES).writeheader()


def log_divination(theme: str, question: str | None, text: str) -> None:
    """Append a completed divination to the CSV log."""
    try:
        _ensure_file()
        with open(LOG_FILE, "a", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writerow({
                "timestamp": datetime.now().isoformat(timespec="seconds"),
                "theme": theme,
                "question": question or "",
                "divination": text,
            })
    except Exception:
        logger.exception("Failed to write divination log")

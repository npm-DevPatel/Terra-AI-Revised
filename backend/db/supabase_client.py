"""
backend/db/supabase_client.py
──────────────────────────────────────────────────────────────
Terra AI — Supabase Python client singleton

Reads SUPABASE_URL and SUPABASE_ANON_KEY from environment.
Both are set in the repo-root .env and loaded by routes.py
via python-dotenv before this module is imported.
──────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import os
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from supabase import Client  # type: ignore[import]

# The public module-level name — always defined (may be None if unavailable)
supabase_client: Optional["Client"] = None  # type: ignore[assignment]

try:
    from supabase import create_client  # type: ignore[import]

    _url = os.getenv("SUPABASE_URL", "")
    _key = os.getenv("SUPABASE_ANON_KEY", "")

    if _url and _key:
        supabase_client = create_client(_url, _key)
        print("[Terra AI] Supabase client initialized.")
    else:
        print(
            "[Terra AI] WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not set. "
            "DB caching and report history are disabled."
        )

except ImportError:
    print(
        "[Terra AI] WARNING: supabase package not installed. "
        "Run: pip install supabase"
    )
except Exception as exc:
    print(f"[Terra AI] WARNING: Supabase init failed (non-fatal): {exc}")

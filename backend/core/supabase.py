"""
core/supabase.py — Supabase client factory for Terra AI.
Provides both a shared anon client and per-request authed clients.
"""
import os
from typing import Optional

_SB_URL = os.getenv("SUPABASE_URL", "")
_SB_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
_SB_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Shared anon client — used for public reads
_anon_client = None


def get_client():
    """Return the shared anon Supabase client. Initialised once."""
    global _anon_client
    if _anon_client is not None:
        return _anon_client
    try:
        from supabase import create_client  # type: ignore
        if _SB_URL and _SB_ANON_KEY:
            _anon_client = create_client(_SB_URL, _SB_ANON_KEY)
            print("[Terra AI] Supabase anon client ready.")
        else:
            print("[Terra AI] WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not set.")
    except ImportError:
        print("[Terra AI] WARNING: supabase package not installed.")
    except Exception as exc:
        print(f"[Terra AI] WARNING: Supabase init failed: {exc}")
    return _anon_client


def get_service_client():
    """
    Return a service-role Supabase client that bypasses RLS.
    Used by Python API routes that write on behalf of a user
    (the user_id is embedded in the row, not derived from the session).
    """
    try:
        from supabase import create_client  # type: ignore
        key = _SB_SERVICE_KEY if _SB_SERVICE_KEY else _SB_ANON_KEY
        if _SB_URL and key:
            return create_client(_SB_URL, key)
    except Exception as exc:
        print(f"[Terra AI] WARNING: Service client init failed: {exc}")
    return None

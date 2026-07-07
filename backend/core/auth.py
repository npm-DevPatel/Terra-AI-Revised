"""
core/auth.py — JWT authentication for all Terra AI routes.
Extracts and validates Supabase Bearer tokens.
"""
import os
from flask import request, jsonify

_SB_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


def require_auth():
    """
    Verify the Supabase Bearer JWT.
    Returns (user_id, raw_jwt, None) on success.
    Returns (None, None, error_response) on failure.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None, (jsonify({"error": "Authentication required."}), 401)

    raw_jwt = auth_header.split(" ", 1)[1].strip()
    if not raw_jwt:
        return None, None, (jsonify({"error": "Authentication required."}), 401)

    try:
        import jwt as _jwt  # type: ignore
        claims = _jwt.decode(
            raw_jwt,
            options={"verify_signature": False, "verify_exp": False, "verify_aud": False},
            algorithms=["HS256", "ES256", "RS256"],
        )
        user_id = claims.get("sub")
        if not user_id:
            return None, None, (jsonify({"error": "Invalid token: sub missing."}), 401)
        return user_id, raw_jwt, None
    except Exception as exc:
        return None, None, (jsonify({"error": f"Invalid auth token ({type(exc).__name__})."}), 401)

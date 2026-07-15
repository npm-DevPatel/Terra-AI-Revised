"""
invites/routes.py — Terra AI Project Invitations

Endpoints:
  POST /api/invites/send    — Send a branded email invite via Resend
  GET  /api/invites/accept  — Accept invite link, add user to project_members
  GET  /api/invites/pending — List pending invites for a project
  DELETE /api/invites/<id>  — Cancel / revoke an invite
"""
import os
import uuid
import json
import logging
from datetime import datetime, timezone

import requests
from flask import Blueprint, jsonify, request, redirect

from core.auth import require_auth
from core.supabase import get_service_client

logger = logging.getLogger(__name__)
bp = Blueprint("invites", __name__)

RESEND_API_KEY  = os.getenv("RESEND_API_KEY", "")
FRONTEND_URL    = os.getenv("FRONTEND_URL", "https://terra-ai-revised-1.onrender.com").rstrip("/")
FROM_EMAIL      = os.getenv("INVITE_FROM_EMAIL", "Terra AI <invites@terra-ai.app>")


# ── helpers ──────────────────────────────────────────────────────────────────

def _send_resend_email(to: str, subject: str, html: str) -> bool:
    """Send an email via the Resend HTTP API. Returns True on success."""
    if not RESEND_API_KEY:
        logger.warning("[Invites] RESEND_API_KEY not set — skipping email send.")
        return False
    try:
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html},
            timeout=10,
        )
        if resp.status_code in (200, 201):
            return True
        logger.warning(f"[Invites] Resend returned {resp.status_code}: {resp.text}")
        return False
    except Exception as exc:
        logger.error(f"[Invites] Resend request failed: {exc}")
        return False


def _invite_email_html(inviter_name: str, project_name: str, accept_url: str) -> str:
    """Return a beautiful branded Terra AI invite email as an HTML string."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>You've been invited to Terra AI</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#134e3a 100%);padding:36px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;background:#10b981;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                      <span style="color:#fff;font-size:18px;font-weight:900;">T</span>
                    </div>
                    <span style="color:#10b981;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Terra AI</span>
                  </div>
                  <p style="color:#6ee7b7;font-size:12px;margin:6px 0 0;letter-spacing:0.06em;text-transform:uppercase;">Where Building Begins…</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="font-size:13px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Project Invitation</p>
            <h1 style="font-size:26px;font-weight:800;color:#0f172a;margin:0 0 16px;line-height:1.3;">
              You've been invited to collaborate
            </h1>
            <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
              <strong style="color:#0f172a;">{inviter_name}</strong> has invited you to join
              <strong style="color:#0f172a;">{project_name}</strong> on Terra AI —
              the AI-powered land intelligence and construction planning platform.
            </p>

            <!-- Project card -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #10b981;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
              <p style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Project</p>
              <p style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 4px;">{project_name}</p>
              <p style="font-size:13px;color:#64748b;margin:0;">Terra AI Workspace</p>
            </div>

            <!-- CTA Button -->
            <div style="text-align:center;margin-bottom:32px;">
              <a href="{accept_url}"
                 style="display:inline-block;background:#10b981;color:#fff;font-size:15px;font-weight:700;padding:15px 40px;border-radius:100px;text-decoration:none;letter-spacing:0.01em;box-shadow:0 4px 20px rgba(16,185,129,0.4);">
                Accept Invitation →
              </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0 0 8px;">
              Or copy this link into your browser:
            </p>
            <p style="font-size:11px;color:#64748b;text-align:center;word-break:break-all;background:#f8fafc;border-radius:8px;padding:10px;margin:0;">
              {accept_url}
            </p>
          </td>
        </tr>

        <!-- What you get -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">What you'll have access to</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:8px;padding-bottom:12px;">
                  <div style="background:#f0fdf4;border-radius:10px;padding:14px 16px;">
                    <p style="font-size:12px;font-weight:700;color:#10b981;margin:0 0 4px;">Terra Lens</p>
                    <p style="font-size:12px;color:#475569;margin:0;">AI land analysis &amp; site intelligence</p>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;padding-bottom:12px;">
                  <div style="background:#eff6ff;border-radius:10px;padding:14px 16px;">
                    <p style="font-size:12px;font-weight:700;color:#3b82f6;margin:0 0 4px;">Terra Planner</p>
                    <p style="font-size:12px;color:#475569;margin:0;">AI construction roadmaps</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#f5f3ff;border-radius:10px;padding:14px 16px;">
                    <p style="font-size:12px;font-weight:700;color:#8b5cf6;margin:0 0 4px;">Terra Report</p>
                    <p style="font-size:12px;color:#475569;margin:0;">Professional PDF reports</p>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#fff7ed;border-radius:10px;padding:14px 16px;">
                    <p style="font-size:12px;font-weight:700;color:#f59e0b;margin:0 0 4px;">Team Channels</p>
                    <p style="font-size:12px;color:#475569;margin:0;">Collaborate in real-time</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:24px 40px;">
            <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
              This invite was sent by {inviter_name} via Terra AI.
              If you didn't expect this, you can safely ignore this email.
              This link expires in 7 days.
            </p>
            <p style="font-size:11px;color:#cbd5e1;margin:12px 0 0;">
              Terra AI — Where Building Begins… &nbsp;·&nbsp; Nairobi, Kenya
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ── POST /api/invites/send ────────────────────────────────────────────────────

@bp.route("/api/invites/send", methods=["POST"])
def send_invite():
    """
    Send a branded email invite to collaborate on a project.
    Body: { project_id, email }
    """
    user_id, _, err = require_auth()
    if err:
        return err

    body       = request.get_json(silent=True) or {}
    project_id = body.get("project_id")
    email      = (body.get("email") or "").strip().lower()

    if not project_id or not email or "@" not in email:
        return jsonify({"error": "project_id and a valid email are required."}), 400

    sb = get_service_client()
    if not sb:
        return jsonify({"error": "Database unavailable."}), 503

    # Fetch project name
    try:
        p = sb.table("projects").select("name").eq("id", project_id).single().execute()
        project_name = (p.data or {}).get("name", "a Terra AI project")
    except Exception:
        project_name = "a Terra AI project"

    # Fetch inviter profile
    try:
        prof = sb.table("profiles").select("display_name, username").eq("id", user_id).single().execute()
        pd = prof.data or {}
        inviter_name = pd.get("display_name") or pd.get("username") or "A teammate"
    except Exception:
        inviter_name = "A teammate"

    # Check for an existing pending invite
    try:
        existing = (sb.table("project_invites")
                    .select("id")
                    .eq("project_id", project_id)
                    .eq("email", email)
                    .is_("accepted_at", "null")
                    .execute())
        if existing.data:
            return jsonify({"error": "An invite has already been sent to this email."}), 409
    except Exception:
        pass

    # Create invite record with a unique token
    token   = str(uuid.uuid4())
    inv_id  = str(uuid.uuid4())
    try:
        sb.table("project_invites").insert({
            "id":          inv_id,
            "project_id":  project_id,
            "invited_by":  user_id,
            "email":       email,
            "token":       token,
        }).execute()
    except Exception as exc:
        logger.error(f"[Invites] DB insert failed: {exc}")
        return jsonify({"error": "Could not create invite record."}), 500

    # Build accept URL and send email
    accept_url = f"{FRONTEND_URL}/invite/accept?token={token}"
    html       = _invite_email_html(inviter_name, project_name, accept_url)
    sent       = _send_resend_email(email, f"{inviter_name} invited you to {project_name} on Terra AI", html)

    return jsonify({
        "success": True,
        "email_sent": sent,
        "invite_id": inv_id,
        "message": f"Invite sent to {email}" if sent else f"Invite recorded but email delivery requires RESEND_API_KEY.",
    })


# ── GET /api/invites/accept ───────────────────────────────────────────────────

@bp.route("/api/invites/accept", methods=["GET"])
def accept_invite():
    """
    Accept an invite via token link.
    The authenticated user who clicks the link gets added to project_members.
    Query: ?token=<uuid>
    Redirects to /workspace/<project_id>/lens on success.
    """
    token = request.args.get("token", "").strip()
    if not token:
        return redirect(f"{FRONTEND_URL}/?invite_error=missing_token")

    # Look up invite (may be called without auth header — user might not be logged in yet)
    sb = get_service_client()
    if not sb:
        return redirect(f"{FRONTEND_URL}/?invite_error=db_unavailable")

    try:
        inv_res = (sb.table("project_invites")
                   .select("id, project_id, email, accepted_at")
                   .eq("token", token)
                   .single()
                   .execute())
        invite = inv_res.data
    except Exception:
        invite = None

    if not invite:
        return redirect(f"{FRONTEND_URL}/?invite_error=invalid_token")

    if invite.get("accepted_at"):
        return redirect(f"{FRONTEND_URL}/workspace/{invite['project_id']}/lens?invite=already_accepted")

    # Try to get the logged-in user from the Authorization header
    user_id, _, err = require_auth()
    if err:
        # Not logged in — redirect to login page with token preserved so they can log in first
        return redirect(f"{FRONTEND_URL}/login?invite_token={token}")

    project_id = invite["project_id"]

    # Check if already a member
    try:
        existing_member = (sb.table("project_members")
                           .select("user_id")
                           .eq("project_id", project_id)
                           .eq("user_id", user_id)
                           .execute())
        if not existing_member.data:
            sb.table("project_members").insert({
                "project_id": project_id,
                "user_id":    user_id,
                "role":       "member",
            }).execute()
    except Exception as exc:
        logger.warning(f"[Invites] project_members insert failed: {exc}")

    # Mark invite as accepted
    try:
        sb.table("project_invites").update({
            "accepted_at": datetime.now(timezone.utc).isoformat(),
            "accepted_by": user_id,
        }).eq("id", invite["id"]).execute()
    except Exception as exc:
        logger.warning(f"[Invites] accepted_at update failed: {exc}")

    return redirect(f"{FRONTEND_URL}/workspace/{project_id}/lens?invite=accepted")


# ── GET /api/invites/pending ──────────────────────────────────────────────────

@bp.route("/api/invites/pending", methods=["GET"])
def list_pending():
    """
    List pending (un-accepted) invites for a project.
    Query: ?project_id=<uuid>
    """
    user_id, _, err = require_auth()
    if err:
        return err

    project_id = request.args.get("project_id", "").strip()
    if not project_id:
        return jsonify({"error": "project_id is required."}), 400

    sb = get_service_client()
    if not sb:
        return jsonify({"invites": []})

    try:
        res = (sb.table("project_invites")
               .select("id, email, created_at, invited_by")
               .eq("project_id", project_id)
               .is_("accepted_at", "null")
               .order("created_at", desc=True)
               .execute())
        return jsonify({"invites": res.data or []})
    except Exception as exc:
        logger.error(f"[Invites] list_pending failed: {exc}")
        return jsonify({"invites": []})


# ── DELETE /api/invites/<invite_id> ──────────────────────────────────────────

@bp.route("/api/invites/<invite_id>", methods=["DELETE"])
def revoke_invite(invite_id: str):
    """Revoke / cancel a pending invite."""
    user_id, _, err = require_auth()
    if err:
        return err

    sb = get_service_client()
    if not sb:
        return jsonify({"error": "Database unavailable."}), 503

    try:
        sb.table("project_invites").delete().eq("id", invite_id).eq("invited_by", user_id).execute()
        return jsonify({"success": True})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

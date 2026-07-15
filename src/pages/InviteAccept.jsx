/**
 * InviteAccept.jsx — Handles /invite/accept?token=<uuid>
 *
 * When someone clicks the email link they land here.
 * If not logged in → show auth prompt, then redirect back with token.
 * If logged in → hit the backend accept endpoint → redirect to workspace.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../lib/apiBase';
import useTerraStore from '../store/useTerraStore';

export default function InviteAccept() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, openAuthModal } = useTerraStore();
  const token = params.get('token') || params.get('invite_token');

  const [status, setStatus] = useState('loading'); // loading | success | error | needs_login
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid invite link — no token found.'); return; }

    if (!session) {
      // Not logged in — prompt login, storing token in sessionStorage so we can retry after auth
      sessionStorage.setItem('pending_invite_token', token);
      setStatus('needs_login');
      return;
    }

    // Logged in — hit accept endpoint
    acceptInvite();
  }, [token, session]);

  async function acceptInvite() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/invites/accept?token=${token}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        redirect: 'manual', // backend redirects, we handle manually
      });

      // Backend returns 3xx redirects — follow the Location header
      if (res.type === 'opaqueredirect' || res.status === 0) {
        // The fetch followed a redirect to an external URL — just navigate to workspace
        setStatus('success');
        setMessage('You\'ve joined the project!');
        setTimeout(() => navigate('/workspace'), 2000);
        return;
      }

      // If we get a non-redirect response, parse it
      const location = res.headers.get('Location') || '';
      if (location.includes('invite=accepted') || location.includes('/workspace/')) {
        setStatus('success');
        setMessage('You\'ve joined the project!');
        const match = location.match(/\/workspace\/([^/]+)\//);
        setTimeout(() => navigate(match ? `/workspace/${match[1]}/lens` : '/workspace'), 1800);
      } else if (location.includes('invite_error')) {
        const err = new URL(location).searchParams.get('invite_error');
        setStatus('error');
        setMessage(err === 'invalid_token' ? 'This invite link is invalid or has expired.' : 'Something went wrong.');
      } else {
        setStatus('success');
        setMessage('Invite accepted! Redirecting…');
        setTimeout(() => navigate('/workspace'), 2000);
      }
    } catch (e) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  function handleLogin() {
    openAuthModal({ tab: 'login' });
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#134e3a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Gabarito','Inter',system-ui",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#fff', borderRadius: 24, padding: '48px 40px',
          width: '100%', maxWidth: 440, textAlign: 'center',
          boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: '#10b981', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>T</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>Terra AI</span>
        </div>

        {status === 'loading' && (
          <>
            <Loader2 size={40} color="#10b981" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Joining project…</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Processing your invitation</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Welcome to Terra AI!</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>{message}</p>
            <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.8 }}
                style={{ height: '100%', background: '#10b981', borderRadius: 4 }} />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={32} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Invite error</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>{message}</p>
            <button onClick={() => navigate('/')} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 100, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Go to Terra AI
            </button>
          </>
        )}

        {status === 'needs_login' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: 32 }}>👋</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>You've been invited!</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
              Sign in or create a free account to accept this invitation and join the project.
            </p>
            <button onClick={handleLogin} style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: 100, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
              Sign in to Accept
            </button>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
              No account yet? You can sign up on the next screen.
            </p>
          </>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </div>
  );
}

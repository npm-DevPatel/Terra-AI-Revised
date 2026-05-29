/**
 * AuthModal.jsx
 * ──────────────────────────────────────────────────────────────
 * Terra AI — Polished Supabase Email/Password Auth Modal
 *
 * Props:
 *   isOpen:    boolean
 *   onClose:   () => void
 *   message:   string | null  — optional gate message shown above the form
 * ──────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Send, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import terraLogo from '../../assets/front_page/terra_logo.png';

// ── Tiny input field wrapper ──────────────────────────────────
function AuthField({ id, label, type, value, onChange, icon: Icon, autoComplete }) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword ? (showPass ? 'text' : 'password') : type;

  return (
    <div className="relative group">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
          <Icon className="w-4 h-4" />
        </span>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className={`
            w-full bg-white/5 border border-white/10 rounded-xl
            pl-10 ${isPassword ? 'pr-10' : 'pr-4'} py-3
            text-sm text-white placeholder-slate-600
            focus:outline-none focus:border-emerald-500/60 focus:bg-white/8
            transition-all duration-200
          `}
          placeholder={isPassword ? '••••••••' : `you@example.com`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────
export default function AuthModal({ isOpen, onClose, message = null }) {
  const [tab, setTab]               = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]           = useState('');
  const [password, setPass]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [checkEmailSent, setCheckEmailSent] = useState(false); // dedicated confirm screen

  // Reset form whenever modal opens/tabs switch
  useEffect(() => {
    setEmail('');
    setPass('');
    setError(null);
    setSuccess(null);
    setLoading(false);
    setCheckEmailSent(false);
  }, [isOpen, tab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (tab === 'signin') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        onClose();
        return;
      }

      if (tab === 'forgot') {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });
        if (resetErr) throw resetErr;
        setSuccess('Password reset link sent! Please check your email.');
        return;
      }

      // signup
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpErr) throw signUpErr;

      // If email confirmation is disabled, user is signed in immediately
      if (signUpData?.session) {
        onClose();
      } else {
        // Show the dedicated "check your email" screen
        setCheckEmailSent(true);
      }
    } catch (err) {
      // Map raw Supabase errors to friendly messages
      const msg = err.message ?? '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError(
          'Please confirm your email first — check your inbox for a confirmation link. ' +
          'Or ask the admin to disable email confirmation in Supabase settings.'
        );
      } else if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.toLowerCase().includes('user already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
        setTab('signin');
      } else {
        setError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* ── Modal Panel ── */}
          <motion.div
            key="auth-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glass card */}
              <div className="relative bg-[#0d1117]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

                {/* ── Check-email confirmation screen ── */}
                <AnimatePresence mode="wait">
                  {checkEmailSent ? (
                    <motion.div
                      key="check-email"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-6 py-10 flex flex-col items-center text-center"
                    >
                      {/* Animated envelope */}
                      <motion.div
                        initial={{ y: -10, rotate: -6 }}
                        animate={{ y: [0, -8, 0], rotate: [0, 4, 0, -4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-900/60 mb-6"
                      >
                        <Send className="w-9 h-9 text-white" />
                      </motion.div>

                      <h2 className="text-2xl font-black text-white mb-3">Check your inbox!</h2>
                      <p className="text-slate-400 text-sm leading-relaxed mb-2">
                        We sent a confirmation link to
                      </p>
                      <p className="text-emerald-400 font-bold text-sm mb-5 break-all">{email}</p>
                      <p className="text-slate-500 text-xs leading-relaxed mb-8 max-w-xs">
                        Click the link in the email to activate your account.
                        Check your spam folder if you don't see it within a minute.
                      </p>

                      <button
                        onClick={() => { setCheckEmailSent(false); setTab('signin'); }}
                        className="w-full flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white text-sm font-semibold rounded-xl px-5 py-3 transition-all"
                      >
                        ← Back to Sign In
                      </button>

                      <button
                        onClick={onClose}
                        className="mt-3 text-xs text-slate-500 hover:text-slate-400 transition-colors"
                      >
                        Close
                      </button>
                    </motion.div>
                  ) : (
                  <motion.div key="auth-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-5 sm:px-8 pt-7 sm:pt-8 pb-10">
                  {/* Decorative orb */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-emerald-300/10 rounded-full blur-xl pointer-events-none" />

                  {/* Logo */}
                  <div className="flex items-center gap-2.5 relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-white border border-white/20 flex items-center justify-center shadow-lg overflow-hidden">
                      <img
                        src={terraLogo}
                        alt="Terra"
                        className="w-7 h-7 object-contain"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                    <span className="text-white font-bold text-base tracking-tight">
                      Terra <span className="text-emerald-300">AI</span>
                    </span>
                  </div>

                  {/* Gate message or title */}
                  <div className="mt-5 relative z-10">
                    {message ? (
                      <>
                        <div className="flex items-start gap-2 bg-white/10 border border-white/20 rounded-xl px-3.5 py-3 mb-3">
                          <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-white/90 leading-snug">{message}</p>
                        </div>
                        <h2 className="text-xl font-black text-white">
                          {tab === 'signin' ? 'Sign in to continue' : tab === 'forgot' ? 'Reset password' : 'Create your account'}
                        </h2>
                      </>
                    ) : (
                      <h2 className="text-2xl font-black text-white">
                        {tab === 'signin' ? 'Welcome back' : tab === 'forgot' ? 'Reset password' : 'Join Terra AI'}
                      </h2>
                    )}
                    <p className="text-emerald-200 text-sm mt-1">
                      {tab === 'signin'
                        ? 'Sign in to access your land analysis reports.'
                        : tab === 'forgot'
                        ? "Enter your email and we'll send you a reset link."
                        : 'Free account. Run your first analysis in 60 seconds.'}
                    </p>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Overlap tab switcher */}
                {tab !== 'forgot' && (
                  <div className="relative -mt-5 flex justify-center z-10">
                    <div className="flex bg-[#0d1117] border border-white/10 rounded-2xl p-1 shadow-xl">
                      {['signin', 'signup'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          className={`
                            relative px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                            ${tab === t
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                              : 'text-slate-400 hover:text-slate-200'}
                          `}
                        >
                          {t === 'signin' ? 'Sign In' : 'Sign Up'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Form body ── */}
                <div className="px-5 sm:px-8 pt-6 pb-6 sm:pb-8">
                  {/* Success banner */}
                  <AnimatePresence>
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-2 bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-3 mb-5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-emerald-300 leading-snug">{success}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error banner */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 rounded-xl px-3.5 py-3 mb-5"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300 leading-snug">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AuthField
                      id="auth-email"
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={Mail}
                      autoComplete="email"
                    />
                    
                    {tab !== 'forgot' && (
                      <AuthField
                        id="auth-password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPass(e.target.value)}
                        icon={Lock}
                        autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                      />
                    )}

                    {tab === 'signin' && (
                      <div className="flex justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => setTab('forgot')}
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    )}

                    <button
                      id="auth-submit-btn"
                      type="submit"
                      disabled={loading || !email || (tab !== 'forgot' && !password)}
                      className="
                        w-full mt-2 flex items-center justify-center gap-2.5
                        bg-gradient-to-r from-emerald-500 to-emerald-600
                        hover:from-emerald-600 hover:to-emerald-700
                        disabled:opacity-50 disabled:cursor-not-allowed
                        text-white font-bold text-sm rounded-xl px-5 py-3.5
                        shadow-lg shadow-emerald-900/40
                        transition-all duration-200 active:scale-[0.98]
                      "
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : tab === 'forgot' ? (
                        <KeyRound className="w-4 h-4" />
                      ) : null}
                      {loading
                        ? (tab === 'signin' ? 'Signing in…' : tab === 'forgot' ? 'Sending link…' : 'Creating account…')
                        : (tab === 'signin' ? 'Sign In →' : tab === 'forgot' ? 'Send Reset Link' : 'Create Account →')}
                    </button>
                  </form>

                  {/* Footer link */}
                  <p className="text-center text-xs text-slate-500 mt-5">
                    {tab === 'signin' ? "Don't have an account? " : tab === 'forgot' ? "Remember your password? " : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      {tab === 'signin' ? 'Sign up free' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </motion.div>
              )}
              </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

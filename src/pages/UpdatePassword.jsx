import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import terraLogo from '../assets/front_page/terra_logo.png';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verifyingSession, setVerifyingSession] = useState(true);

  useEffect(() => {
    // Verify if the user has an active session (they just clicked the reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If there's no session, they might be accessing this route directly without a token
        // In some flows, the token might be in the URL hash and Supabase is processing it.
        // We'll give Supabase a moment to process the hash.
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          if (!delayedSession) {
            navigate('/', { replace: true });
          } else {
            setVerifyingSession(false);
          }
        }, 1000);
      } else {
        setVerifyingSession(false);
      }
    };

    checkSession();

    // Listen for auth state changes just in case
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setVerifyingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      
      setSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Glass card */}
        <div className="relative bg-[#0d1117]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header Area */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-5 sm:px-8 pt-7 sm:pt-8 pb-10">
            {/* Decorative orb */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
            
            {/* Logo */}
            <div className="flex items-center gap-2.5 relative z-10 mb-5">
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

            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white">Update Password</h2>
              <p className="text-emerald-200 text-sm mt-1">
                Please enter your new password below.
              </p>
            </div>
          </div>

          {/* Form body */}
          <div className="px-5 sm:px-8 pt-6 pb-6 sm:pb-8">
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
              <div className="relative group">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
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
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Updating...' : 'Update Password →'}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

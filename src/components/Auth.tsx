/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Activity, Wallet, ShieldCheck, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onSuccess: (token: string, user: any) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    const url = isForgotPassword 
      ? '/api/auth/reset-password'
      : isLogin 
        ? '/api/auth/login' 
        : '/api/auth/register';

    const body = isForgotPassword
      ? { email: trimmedEmail, newPassword: trimmedPassword }
      : isLogin
        ? { email: trimmedEmail, password: trimmedPassword }
        : { email: trimmedEmail, name: trimmedName, password: trimmedPassword };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isForgotPassword) {
        setMessage('Password updated successfully! Please sign in with your new password.');
        setPassword('');
        setIsForgotPassword(false);
        setIsLogin(true);
      } else {
        onSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Decorative Blur Blobs to enhance glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-300/20 dark:bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-300/20 dark:bg-fuchsia-900/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="h-10 w-10 purple-grad text-white flex items-center justify-center rounded-xl font-bold shadow-lg shadow-purple-500/20">
            FP
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            FinPilot <span className="text-gradient font-extrabold">AI</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          {isForgotPassword 
            ? 'Reset your password' 
            : isLogin 
              ? 'Sign in to your account' 
              : 'Create your free account'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Or{' '}
          {isForgotPassword ? (
            <button 
              onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(''); setMessage(''); }}
              className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 transition cursor-pointer"
            >
              back to login
            </button>
          ) : isLogin ? (
            <button 
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 transition cursor-pointer"
            >
              create a new account
            </button>
          ) : (
            <button 
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 transition cursor-pointer"
            >
              sign in to existing account
            </button>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="glass-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-purple-100/40 dark:border-purple-900/20"
        >
          {/* Prominent Tab Selector */}
          {!isForgotPassword && (
            <div className="flex border-b border-purple-100/30 dark:border-purple-900/30 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setIsForgotPassword(false);
                  setError('');
                  setMessage('');
                }}
                id="auth-tab-login"
                className={`flex-1 text-center pb-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  isLogin
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Sign In / Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setIsForgotPassword(false);
                  setError('');
                  setMessage('');
                }}
                id="auth-tab-register"
                className={`flex-1 text-center pb-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  !isLogin
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Register / Sign Up
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50/80 dark:bg-red-950/40 backdrop-blur-sm border-l-4 border-red-400 p-4 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              {error.toLowerCase().includes('already registered') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setIsForgotPassword(false);
                    setError('');
                  }}
                  className="mt-2 text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:text-purple-800 underline block cursor-pointer"
                >
                  Click here to switch to the Login / Sign In form →
                </button>
              )}
            </div>
          )}

          {message && (
            <div className="mb-4 bg-emerald-50/80 dark:bg-emerald-950/40 backdrop-blur-sm border-l-4 border-emerald-400 p-4 rounded-md">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && !isForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-lg focus:outline-none sm:text-sm text-slate-800 dark:text-slate-100"
                    placeholder="Your Name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-lg focus:outline-none sm:text-sm text-slate-800 dark:text-slate-100"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {isForgotPassword ? 'New Password' : 'Password'}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input block w-full pl-10 pr-10 py-2.5 rounded-lg focus:outline-none sm:text-sm text-slate-800 dark:text-slate-100"
                  placeholder={isForgotPassword ? "Enter new password" : "••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {isLogin && !isForgotPassword && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                    Keep me signed in
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); }}
                    className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 transition cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white purple-grad purple-grad-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition duration-150 ease-in-out cursor-pointer shadow-purple-500/20"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-white" />
                ) : isForgotPassword ? (
                  'Reset Password'
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Free Account'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

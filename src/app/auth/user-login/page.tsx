'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Layers, ArrowLeft, Sparkles, Mail, Send, CheckCircle2,
    Loader2, Users, Clock, Shield
} from 'lucide-react'

function UserLoginContent() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const [error, setError] = useState('')
    const [sent, setSent] = useState(false)
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const next = searchParams.get('next') ?? '/offices'

    // Auto-restore: if user already logged in, redirect appropriately
    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: token } = await supabase
                    .from('queue_tokens')
                    .select('id')
                    .eq('user_id', user.id)
                    .in('status', ['waiting', 'serving'])
                    .maybeSingle()

                if (token) {
                    router.replace('/my-queue')
                } else {
                    router.replace(next)
                }
                return
            }
            setCheckingSession(false)
        }
        check()
    }, [supabase, router, next])

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
                queryParams: {
                    prompt: 'select_account',
                },
            },
        })
        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
        })

        if (error) {
            setError(error.message)
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-brand-50/20 flex flex-col">
            {/* Header */}
            <header className="py-5 px-6">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-bold text-slate-900">Q‑Pro</span>
                    </Link>
                    <Link
                        href="/auth/login"
                        className="text-xs font-medium text-slate-500 hover:text-brand-600 flex items-center gap-1.5 transition-colors"
                    >
                        <Shield className="w-3.5 h-3.5" />
                        Admin Login
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-4">
                            <Users className="w-3.5 h-3.5" />
                            Citizen / User Access
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Join the Queue</h1>
                        <p className="text-slate-500 text-sm">
                            Sign in instantly to join, track, and manage your queue position in real-time.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="card"
                    >
                        <AnimatePresence mode="wait">
                            {sent ? (
                                /* ── Success state ── */
                                <motion.div
                                    key="sent"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-1">Check your inbox!</h2>
                                    <p className="text-sm text-slate-500 mb-2">
                                        We sent a secure login link to
                                    </p>
                                    <p className="text-sm font-semibold text-brand-600 mb-5">{email}</p>
                                    <p className="text-xs text-slate-400">
                                        Click the link in the email to sign in automatically. No password needed.
                                    </p>
                                    <button
                                        onClick={() => { setSent(false); setEmail('') }}
                                        className="mt-6 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
                                    >
                                        ← Use a different email
                                    </button>
                                </motion.div>
                            ) : (
                                /* ── Login form ── */
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                                            >
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Google */}
                                    <button
                                        onClick={handleGoogleLogin}
                                        disabled={loading}
                                        id="google-signin-btn"
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-60 mb-5"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            /* Google G icon */
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                        )}
                                        Continue with Google
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="flex-1 h-px bg-slate-100" />
                                        <span className="text-xs text-slate-400 font-medium">or sign in with email</span>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>

                                    {/* Magic Link form */}
                                    <form onSubmit={handleMagicLink} className="space-y-4">
                                        <div>
                                            <label className="label" htmlFor="user-email">Email address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    id="user-email"
                                                    type="email"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    placeholder="you@example.com"
                                                    required
                                                    className="input pl-10"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !email.trim()}
                                            id="magic-link-btn"
                                            className="btn-primary w-full py-3 text-sm disabled:opacity-60"
                                        >
                                            {loading ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</>
                                            ) : (
                                                <><Send className="w-4 h-4" /> Send Magic Link</>
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-slate-400">
                                            No password required — we&apos;ll email you a one-tap sign-in link
                                        </p>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Feature pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="flex items-center justify-center gap-4 mt-6 flex-wrap"
                    >
                        {[
                            { icon: <Clock className="w-3 h-3" />, label: 'Live wait time' },
                            { icon: <Sparkles className="w-3 h-3" />, label: 'No app download' },
                            { icon: <Shield className="w-3 h-3" />, label: 'Secure & private' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <span className="text-brand-500">{item.icon}</span>
                                {item.label}
                            </div>
                        ))}
                    </motion.div>

                    <p className="text-center text-xs text-slate-400 mt-4">
                        Are you an admin?{' '}
                        <Link href="/auth/login" className="text-brand-600 font-semibold hover:text-brand-700">
                            Admin Login →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function UserLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        }>
            <UserLoginContent />
        </Suspense>
    )
}

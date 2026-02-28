'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Chrome, Mail, Lock, ArrowRight, Layers } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const supabase = createClient()
    const router = useRouter()

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (mode === 'login') {
            const { error, data } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                setError(error.message)
                setLoading(false)
                return
            }
            // Redirect based on role
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', data.user?.id)
                .single()

            if (roleData?.role === 'super_admin') {
                router.push('/super-admin/dashboard')
            } else if (roleData?.role === 'office_admin') {
                router.push('/office-admin/dashboard')
            } else {
                router.push('/')
            }
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            })
            if (error) {
                setError(error.message)
                setLoading(false)
                return
            }
            setError('')
            alert('Check your email to confirm your account!')
            setMode('login')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-teal-50/20 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">Q‑Pro</span>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-800">
                        {mode === 'login' ? 'Welcome back' : 'Create account'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {mode === 'login' ? 'Sign in to your Q-Pro account' : 'Join Q-Pro queue management'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="card"
                >
                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Google */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-60 mb-5"
                    >
                        <Chrome className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-xs text-slate-400 font-medium">or use email</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                            <label className="label" htmlFor="email">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="input pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label" htmlFor="password">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="input pl-10"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-5">
                        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                            className="text-brand-600 font-semibold hover:text-brand-700"
                        >
                            {mode === 'login' ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </motion.div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    By continuing, you agree to Q-Pro&apos;s Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    )
}

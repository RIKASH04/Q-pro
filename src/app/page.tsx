'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Layers, ArrowRight, Clock, Users, BarChart3, Shield,
    Smartphone, Zap, Building2, CheckCircle2, ChevronRight,
    QrCode, Bell, Globe
} from 'lucide-react'

const officeTypes = [
    { icon: '🏥', label: 'Hospitals' },
    { icon: '🏛️', label: 'Government Offices' },
    { icon: '📮', label: 'Post Offices' },
    { icon: '🏬', label: 'Ration Shops' },
    { icon: '🪪', label: 'Aadhaar Centers' },
    { icon: '🏢', label: 'Any Public Office' },
]

const features = [
    {
        icon: <QrCode className="w-5 h-5" />,
        title: 'QR-Based Queue Joining',
        desc: 'Citizens scan a QR code to join the queue — no app download required.',
        color: 'blue',
    },
    {
        icon: <Bell className="w-5 h-5" />,
        title: 'Real-Time Updates',
        desc: 'Live token status powered by Supabase Realtime. Zero refresh needed.',
        color: 'teal',
    },
    {
        icon: <Clock className="w-5 h-5" />,
        title: 'Wait Time Estimation',
        desc: 'Intelligent predictions based on average service time per department.',
        color: 'amber',
    },
    {
        icon: <Shield className="w-5 h-5" />,
        title: 'Multi-Tenant Security',
        desc: 'Strict role-based access. Admins only see their own office data.',
        color: 'emerald',
    },
    {
        icon: <Globe className="w-5 h-5" />,
        title: 'Multi-Office Platform',
        desc: 'One platform, 100+ offices. Each fully isolated and independently managed.',
        color: 'violet',
    },
    {
        icon: <Smartphone className="w-5 h-5" />,
        title: 'Mobile-First Design',
        desc: 'Works seamlessly on any device — phone, tablet, or desktop.',
        color: 'rose',
    },
]

const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'bg-brand-50', icon: 'text-brand-600' },
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600' },
}

const steps = [
    { n: '01', title: 'Visit Office Page', desc: 'Scan QR or visit the office link on any device.' },
    { n: '02', title: 'Select Department', desc: 'Choose the service or department you need.' },
    { n: '03', title: 'Get Your Token', desc: 'Receive a unique token number instantly.' },
    { n: '04', title: 'Track Live Status', desc: "Watch your position update in real-time. We'll tell you when it's your turn." },
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="page-container flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900">Q‑Pro</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-1">
                        <a href="#features" className="btn-ghost text-slate-500">Features</a>
                        <a href="#how-it-works" className="btn-ghost text-slate-500">How It Works</a>
                        <a href="#offices" className="btn-ghost text-slate-500">Offices</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link href="/offices" className="btn-secondary hidden sm:inline-flex">
                            View Offices
                        </Link>
                        <Link href="/auth/user-login" className="btn-primary" id="user-login-nav-btn">
                            User Login
                        </Link>
                        <Link
                            href="/auth/login"
                            className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all duration-150"
                            id="admin-login-nav-btn"
                        >
                            Admin Login
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-brand-50/40 to-white pt-20 pb-28">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-grid opacity-40" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-brand-100/60 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-teal-100/40 to-transparent rounded-full blur-3xl" />

                <div className="page-container relative">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6">
                            <Zap className="w-3 h-3" />
                            Real-Time Queue Management SaaS
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 mb-6 leading-[1.1]">
                            End the Chaos of{' '}
                            <span className="text-gradient">Physical Queues</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Q-Pro brings digital queue management to hospitals, government offices, post offices, and more — with live updates, smart estimates, and zero friction.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                            <Link href="/offices" className="btn-primary text-base px-7 py-3.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150">
                                Join a Queue Now
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/auth/user-login" className="btn-secondary text-base px-7 py-3.5" id="user-login-hero-btn">
                                User Sign In
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-xs text-slate-500">Staff or office administrator?</p>
                            <Link href="/auth/login" className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2" id="admin-login-hero-link">
                                Admin Login →
                            </Link>
                        </div>
                    </motion.div>

                    {/* Stats strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="grid grid-cols-3 max-w-lg mx-auto mt-16 gap-0 bg-white rounded-2xl shadow-card border border-slate-100"
                    >
                        {[
                            { val: '100+', label: 'Offices' },
                            { val: '0s', label: 'Refresh Delay' },
                            { val: '99.9%', label: 'Uptime' },
                        ].map((s, i) => (
                            <div key={i} className={`px-6 py-5 text-center ${i < 2 ? 'border-r border-slate-100' : ''}`}>
                                <p className="text-2xl font-bold text-brand-600">{s.val}</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Office Types */}
            <section id="offices" className="py-16 bg-white">
                <div className="page-container">
                    <div className="text-center mb-10">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Built For</p>
                        <h2 className="text-3xl font-bold text-slate-900">Every Type of Public Office</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {officeTypes.map((t, i) => (
                            <motion.div
                                key={t.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: i * 0.06 }}
                                className="card-hover flex flex-col items-center gap-3 py-6 text-center"
                            >
                                <span className="text-3xl">{t.icon}</span>
                                <span className="text-xs font-semibold text-slate-700">{t.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 bg-slate-50">
                <div className="page-container">
                    <div className="text-center mb-12">
                        <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">Platform Features</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Everything You Need</h2>
                        <p className="text-slate-500 mt-3 max-w-xl mx-auto">
                            A complete queue management solution — built for scale, security, and simplicity.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((f, i) => {
                            const c = colorMap[f.color]
                            return (
                                <motion.div
                                    key={f.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    className="card-hover"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${c.bg} ${c.icon}`}>
                                        {f.icon}
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 bg-white">
                <div className="page-container">
                    <div className="text-center mb-14">
                        <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">How It Works</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Simple for Everyone</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((s, i) => (
                            <motion.div
                                key={s.n}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="relative"
                            >
                                {i < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-7 left-full w-full h-px bg-slate-200 z-0 -translate-x-8" />
                                )}
                                <div className="card relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                                        {s.n}
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-br from-brand-600 to-brand-800">
                <div className="page-container text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
                            Ready to Eliminate Queuing Chaos?
                        </h2>
                        <p className="text-brand-200 text-lg mb-8 max-w-xl mx-auto">
                            Join Q-Pro today and give your citizens a better experience.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Link href="/offices" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-all duration-150 shadow-lg">
                                <Building2 className="w-5 h-5" />
                                Browse Offices
                            </Link>
                            <Link href="/auth/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-500/30 text-white font-semibold rounded-xl hover:bg-brand-500/50 border border-white/20 transition-all duration-150">
                                Admin Access
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-10">
                <div className="page-container">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                                <Layers className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-slate-300">Q‑Pro</span>
                        </div>
                        <p className="text-xs">
                            © {new Date().getFullYear()} Q-Pro. Smart Queue Management Platform.
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                            <Link href="/auth/login" className="hover:text-slate-300 transition-colors">Admin Login</Link>
                            <Link href="/offices" className="hover:text-slate-300 transition-colors">View Offices</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

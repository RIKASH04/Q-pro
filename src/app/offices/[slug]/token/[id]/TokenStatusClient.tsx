'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    ChevronLeft, Layers, Clock, Users, CheckCircle2,
    AlertCircle, Loader2, SkipForward, Wifi, Smartphone, Bell, BellRing
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTokenNumber, formatWaitTime, formatTime } from '@/lib/utils'
import { TOKEN_STATUS_COLORS } from '@/lib/constants'
import type { QueueToken, Office, OfficeQueueState } from '@/lib/types'

interface Props {
    token: QueueToken
    office: Office
}

const statusLabels: Record<string, string> = {
    waiting: 'Waiting',
    serving: 'Now Serving',
    served: 'Completed',
    skipped: 'Skipped',
}

const statusIcons: Record<string, React.ReactNode> = {
    waiting: <Clock className="w-5 h-5" />,
    serving: <Wifi className="w-5 h-5" />,
    served: <CheckCircle2 className="w-5 h-5" />,
    skipped: <SkipForward className="w-5 h-5" />,
}

export default function TokenStatusClient({ token: initialToken, office }: Props) {
    const [token, setToken] = useState(initialToken)
    const [waitingAhead, setWaitingAhead] = useState<number | null>(null)
    const [currentServing, setCurrentServing] = useState<number | null>(null)
    const [queueState, setQueueState] = useState<OfficeQueueState | null>(null)
    const [notifications, setNotifications] = useState<string[]>([])
    const [countdown, setCountdown] = useState<number>(0)
    const [currentTime, setCurrentTime] = useState(new Date())
    const supabase = createClient()

    // Clock update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const fetchLiveData = useCallback(async () => {
        const { data: latest } = await supabase
            .from('queue_tokens')
            .select('*, departments(*)')
            .eq('id', token.id)
            .maybeSingle()

        if (latest) {
            if (token.status === 'waiting' && latest.status === 'serving') {
                addNotification("It's your turn! Please proceed to the counter.")
            }
            setToken(latest)
        }

        // Count people ahead
        const { count } = await supabase
            .from('queue_tokens')
            .select('id', { count: 'exact', head: true })
            .eq('office_id', office.id)
            .eq('status', 'waiting')
            .lt('token_number', token.token_number)

        setWaitingAhead(count ?? 0)

        // Current serving token
        const { data: servingToken } = await supabase
            .from('queue_tokens')
            .select('token_number')
            .eq('office_id', office.id)
            .eq('status', 'serving')
            .order('token_number', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (servingToken) setCurrentServing(servingToken.token_number)

        // Queue state
        const { data: state } = await supabase
            .from('office_queue_state')
            .select('*')
            .eq('office_id', office.id)
            .maybeSingle()
        
        if (state) setQueueState(state)
    }, [supabase, token.id, token.token_number, office.id, token.status])

    useEffect(() => {
        fetchLiveData()

        const channel = supabase
            .channel(`office-${office.id}-token-${token.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'queue_tokens',
                    filter: `office_id=eq.${office.id}`,
                },
                () => fetchLiveData()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'office_queue_state',
                    filter: `office_id=eq.${office.id}`,
                },
                (payload) => {
                    if (payload.new) {
                        const newState = payload.new as OfficeQueueState
                        if (queueState?.is_paused === false && newState.is_paused === true) {
                            addNotification("Queue paused by admin.")
                        } else if (queueState?.is_paused === true && newState.is_paused === false) {
                            addNotification("Queue resumed.")
                        }
                        setQueueState(newState)
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [office.id, token.id, fetchLiveData, supabase, queueState])

    const addNotification = (msg: string) => {
        setNotifications(prev => [msg, ...prev].slice(0, 5))
    }

    useEffect(() => {
        if (waitingAhead === 3) addNotification("You are 3 tokens away!")
        if (waitingAhead === 1) addNotification("You are next in line!")
    }, [waitingAhead])

    const avgTime = (token as any).departments?.avg_service_time_mins ?? 5
    const estWaitMins = (waitingAhead ?? 0) * avgTime
    
    useEffect(() => {
        if (queueState?.is_paused || queueState?.is_closed || estWaitMins === 0) {
            setCountdown(0)
            return
        }
        setCountdown(estWaitMins * 60)
        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [estWaitMins, queueState?.is_paused, queueState?.is_closed])

    const estTurnTime = useMemo(() => {
        const d = new Date()
        d.setMinutes(d.getMinutes() + estWaitMins)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, [estWaitMins])

    const isYourTurn = token.status === 'serving'
    const isDone = token.status === 'served' || token.status === 'skipped'

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                <div className="page-container flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <Link href={`/offices/${office.slug}`} className="btn-ghost p-2">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                                <Layers className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-base font-bold text-slate-900">Q‑Pro</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Time</span>
                            <span className="text-sm font-bold text-slate-700">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </div>
                    </div>
                </div>
            </header>

            <div className="page-container py-8 max-w-xl">
                {/* Office Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <h1 className="text-lg font-bold text-slate-900">{office.name}</h1>
                    {token.departments && <p className="text-sm text-brand-600 font-medium">{token.departments.name}</p>}
                </motion.div>

                {/* Toast Notifications */}
                <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                    <AnimatePresence>
                        {notifications.map((n, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border border-white/10"
                            >
                                <BellRing className="w-4 h-4 text-brand-400" />
                                {n}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Turn Alert */}
                <AnimatePresence>
                    {isYourTurn && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white text-center shadow-xl shadow-brand-200"
                        >
                            <div className="flex items-center justify-center gap-3 text-xl font-black mb-2">
                                <Wifi className="w-6 h-6 animate-pulse" />
                                IT&apos;S YOUR TURN!
                            </div>
                            <p className="text-brand-100 font-medium">Please proceed to the counter immediately</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Token Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card text-center mb-6 overflow-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                        <motion.div 
                            className="h-full bg-brand-500"
                            initial={{ width: '0%' }}
                            animate={{ width: isYourTurn ? '100%' : `${Math.max(10, 100 - (waitingAhead ?? 0) * 10)}%` }}
                        />
                    </div>

                    <div className="pt-6 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${TOKEN_STATUS_COLORS[token.status]}`}>
                            {statusLabels[token.status]}
                        </span>
                    </div>

                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Token Number</h2>
                    <div className="flex justify-center mb-4">
                        <motion.div
                            key={token.status}
                            animate={isYourTurn ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ repeat: isYourTurn ? Infinity : 0, duration: 1.5 }}
                            className={`token-display text-6xl py-8 px-12 ${isYourTurn ? 'from-emerald-500 to-emerald-700' : isDone ? 'from-slate-400 to-slate-500' : 'from-brand-500 to-brand-700'}`}
                        >
                            {formatTokenNumber(token.token_number)}
                        </motion.div>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-1">{token.user_name}</p>
                </motion.div>

                {/* Train-Style Estimation */}
                {!isDone && token.status === 'waiting' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="card bg-brand-600 text-white border-none shadow-lg shadow-brand-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-white/20">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest">Est. Turn Time</span>
                            </div>
                            <div className="text-4xl font-black mb-1 tracking-tight">{estTurnTime}</div>
                            <p className="text-[10px] text-brand-100 font-bold uppercase tracking-widest">Expected turn time</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card border-slate-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-slate-50">
                                    <Smartphone className="w-5 h-5 text-brand-500" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest text-slate-900">Countdown</span>
                            </div>
                            <div className="text-4xl font-black text-slate-900 flex items-baseline gap-1">
                                {Math.floor(countdown / 60)}
                                <span className="text-sm font-bold text-slate-400 lowercase">min</span>
                                <span className="text-3xl ml-1 text-brand-600">{String(countdown % 60).padStart(2, '0')}</span>
                                <span className="text-sm font-bold text-slate-400 lowercase">s</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                                {queueState?.is_paused ? (
                                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-black uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        PAUSED
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] text-brand-600 font-black uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                                        LIVE TRACKING
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Stats Row */}
                {!isDone && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="card text-center py-4">
                            <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">People Ahead</p>
                            <p className="text-2xl font-black text-slate-900">{waitingAhead ?? '0'}</p>
                        </div>
                        <div className="card text-center py-4">
                            <Wifi className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Serving Now</p>
                            <p className="text-2xl font-black text-brand-600">{currentServing ? formatTokenNumber(currentServing) : '—'}</p>
                        </div>
                    </div>
                )}

                {/* Done State */}
                {isDone && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center py-10">
                        {token.status === 'served' ? (
                            <>
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                                <h3 className="font-semibold text-slate-900">Service Completed</h3>
                                <p className="text-sm text-slate-500 mt-1">Thank you for using Q-Pro</p>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                <h3 className="font-semibold text-slate-900">Token Skipped</h3>
                                <p className="text-sm text-slate-500 mt-1">Please contact the office admin</p>
                            </>
                        )}
                        <Link href={`/offices/${office.slug}`} className="btn-primary w-full py-3 mt-6 inline-block">
                            Go Back
                        </Link>
                    </motion.div>
                )}

                {/* Footer */}
                <p className="text-center text-[10px] text-slate-400 font-medium px-8 mt-8">
                    Updates automatically. Keep this page open to receive live turn notifications. Powered by Q-Pro.
                </p>
            </div>
        </div>
    )
}

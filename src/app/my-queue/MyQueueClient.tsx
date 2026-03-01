'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, Layers, Clock, Users, CheckCircle2,
    AlertCircle, Loader2, SkipForward, Wifi, Bell, BellRing, LogOut,
    ArrowRight, MapPin, Smartphone, User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTokenNumber, formatWaitTime, formatTime } from '@/lib/utils'
import { TOKEN_STATUS_COLORS, OFFICE_TYPE_ICONS } from '@/lib/constants'
import type { QueueToken, Office, Department, OfficeQueueState } from '@/lib/types'

interface Props {
    initialToken: QueueToken & { offices: Office; departments: Department | null }
    user: any
}

const statusLabels: Record<string, string> = {
    waiting: 'Waiting',
    serving: 'Now Serving',
    served: 'Completed',
    skipped: 'Skipped',
}

export default function MyQueueClient({ initialToken, user }: Props) {
    const [token, setToken] = useState(initialToken)
    const [waitingAhead, setWaitingAhead] = useState<number | null>(null)
    const [currentServing, setCurrentServing] = useState<number | null>(null)
    const [queueState, setQueueState] = useState<OfficeQueueState | null>(null)
    const [notifications, setNotifications] = useState<string[]>([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [countdown, setCountdown] = useState<number>(0)
    const router = useRouter()
    const supabase = createClient()

    const fetchLiveData = useCallback(async () => {
        const { data: latest } = await supabase
            .from('queue_tokens')
            .select('*, offices(*), departments(*)')
            .eq('id', token.id)
            .maybeSingle()

        if (latest) {
            if (latest.status === 'served' || latest.status === 'skipped') {
                router.refresh() // Will trigger redirect/no-token view in server component
                return
            }
            setToken(latest)
        }

        // Count people ahead
        const { count } = await supabase
            .from('queue_tokens')
            .select('id', { count: 'exact', head: true })
            .eq('office_id', token.office_id)
            .eq('status', 'waiting')
            .lt('token_number', token.token_number)

        setWaitingAhead(count ?? 0)

        // Current serving token
        const { data: servingToken } = await supabase
            .from('queue_tokens')
            .select('token_number')
            .eq('office_id', token.office_id)
            .eq('status', 'serving')
            .order('token_number', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (servingToken) setCurrentServing(servingToken.token_number)

        // Queue state (paused/closed)
        const { data: state } = await supabase
            .from('office_queue_state')
            .select('*')
            .eq('office_id', token.office_id)
            .maybeSingle()
        
        if (state) setQueueState(state)
    }, [supabase, token.id, token.office_id, token.token_number, router])

    useEffect(() => {
        fetchLiveData()

        const tokenChannel = supabase
            .channel(`my-token-${token.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'queue_tokens',
                    filter: `office_id=eq.${token.office_id}`,
                },
                (payload) => {
                    fetchLiveData()
                    
                    // Notification logic
                    if (payload.new && (payload.new as any).id === token.id) {
                        const oldStatus = token.status
                        const newStatus = (payload.new as any).status
                        if (oldStatus === 'waiting' && newStatus === 'serving') {
                            addNotification("It's your turn! Please proceed to the counter.")
                        }
                    }
                }
            )
            .subscribe()

        const stateChannel = supabase
            .channel(`office-state-${token.office_id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'office_queue_state',
                    filter: `office_id=eq.${token.office_id}`,
                },
                (payload) => {
                    if (payload.new) {
                        const newState = payload.new as OfficeQueueState
                        const oldState = queueState
                        if (oldState?.is_paused === false && newState.is_paused === true) {
                            addNotification("The queue has been paused by the administrator.")
                        } else if (oldState?.is_paused === true && newState.is_paused === false) {
                            addNotification("The queue has been resumed.")
                        }
                        setQueueState(newState)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(tokenChannel)
            supabase.removeChannel(stateChannel)
        }
    }, [fetchLiveData, token.id, token.office_id, token.status, queueState, supabase])

    // Notifications logic
    const addNotification = (msg: string) => {
        setNotifications(prev => [msg, ...prev].slice(0, 10))
        // Simple toast using browser notification if permitted
        if (Notification.permission === 'granted') {
            new Notification('Q-Pro Update', { body: msg })
        }
    }

    // Effect for "X tokens away" notification
    useEffect(() => {
        if (waitingAhead !== null) {
            if (waitingAhead === 3) addNotification("You are 3 tokens away!")
            if (waitingAhead === 1) addNotification("You are next in line!")
        }
    }, [waitingAhead])

    // Calculation logic
    const avgTime = token.departments?.avg_service_time_mins ?? 5
    const estWaitMins = (waitingAhead ?? 0) * avgTime
    
    // Countdown timer
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

    // Current time clock
    const [currentTime, setCurrentTime] = useState(new Date())
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
                <div className="page-container flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="btn-ghost p-2">
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
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Time</span>
                            <span className="text-sm font-bold text-slate-700">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-full hover:bg-slate-50 transition-colors"
                        >
                            {notifications.length > 0 ? (
                                <BellRing className="w-5 h-5 text-brand-600 animate-bounce" />
                            ) : (
                                <Bell className="w-5 h-5 text-slate-400" />
                            )}
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                            )}
                        </button>
                        <button onClick={handleLogout} className="btn-ghost p-2 text-slate-400 hover:text-red-500">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Notifications Panel */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed top-16 right-4 left-4 sm:left-auto sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                            <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-400">Close</button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="text-xs text-slate-500 py-4 text-center">No new notifications</p>
                            ) : (
                                notifications.map((n, i) => (
                                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-700 border border-slate-100">
                                        {n}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="page-container py-8 max-w-2xl">
                {/* Office Header Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card mb-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl">
                            {OFFICE_TYPE_ICONS[token.offices.type] ?? '🏢'}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">{token.offices.name}</h1>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {token.offices.address || 'Online'}
                                </span>
                                {token.departments && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {token.departments.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Status Bar */}
                <div className="mb-6">
                    {queueState?.is_closed ? (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                            <AlertCircle className="w-4 h-4" /> Queue is currently closed
                        </div>
                    ) : queueState?.is_paused ? (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                            <Clock className="w-4 h-4 animate-pulse" /> Queue is temporarily paused
                        </div>
                    ) : null}
                </div>

                {/* Main Token Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card text-center mb-6 relative overflow-hidden"
                >
                    {/* Progress Background */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                        <motion.div 
                            className="h-full bg-brand-500"
                            initial={{ width: '0%' }}
                            animate={{ width: token.status === 'serving' ? '100%' : `${Math.max(10, 100 - (waitingAhead ?? 0) * 10)}%` }}
                        />
                    </div>

                    <div className="pt-4 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TOKEN_STATUS_COLORS[token.status]}`}>
                            {statusLabels[token.status]}
                        </span>
                    </div>

                    <h2 className="text-sm font-medium text-slate-500 mb-1">Your Token Number</h2>
                    <div className="flex justify-center mb-6">
                        <div className="token-display text-5xl sm:text-6xl py-6 px-10">
                            {formatTokenNumber(token.token_number)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Position</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {token.status === 'serving' ? 'Your Turn' : (waitingAhead ?? 0) + 1}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                {token.status === 'serving' ? 'Go to counter' : 'People in front'}
                            </p>
                        </div>
                        <div className="text-center border-l border-slate-100">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Current Serving</p>
                            <p className="text-2xl font-bold text-brand-600">
                                {currentServing ? formatTokenNumber(currentServing) : '—'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Live status</p>
                        </div>
                    </div>
                </motion.div>

                {/* Estimation Card */}
                <AnimatePresence>
                    {token.status === 'waiting' && !queueState?.is_closed && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                            <div className="card bg-brand-500 text-white border-none shadow-brand-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-white/20">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold">Est. Turn Time</span>
                                </div>
                                <div className="text-3xl font-bold mb-1 tracking-tight">{estTurnTime}</div>
                                <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider">Approximate turn time</p>
                            </div>

                            <div className="card bg-white border-slate-200 relative overflow-hidden group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-brand-50 transition-colors">
                                        <Smartphone className="w-5 h-5 text-slate-500 group-hover:text-brand-500" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">Wait Countdown</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 flex items-baseline gap-1">
                                    <motion.span
                                        key={Math.floor(countdown / 60)}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="inline-block"
                                    >
                                        {Math.floor(countdown / 60)}
                                    </motion.span>
                                    <span className="text-sm font-medium text-slate-500 lowercase">min</span>
                                    <motion.span 
                                        key={countdown % 60}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-2xl ml-1 text-brand-600 inline-block w-[1.5ch]"
                                    >
                                        {String(countdown % 60).padStart(2, '0')}
                                    </motion.span>
                                    <span className="text-sm font-medium text-slate-500 lowercase">s</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2">
                                    {queueState?.is_paused ? (
                                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            Paused
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[10px] text-brand-600 font-bold uppercase tracking-wider">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                                            Live Track
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Info */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400 mb-4">
                        Powered by Q-Pro Real-Time Engine. Keep this page open to receive updates.
                    </p>
                    <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Status Connected
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

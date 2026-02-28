'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    ChevronLeft, Layers, Clock, Users, CheckCircle2,
    AlertCircle, Loader2, SkipForward, Wifi
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTokenNumber, formatWaitTime, formatTime } from '@/lib/utils'
import { TOKEN_STATUS_COLORS } from '@/lib/constants'
import type { QueueToken, Office } from '@/lib/types'

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
    const supabase = createClient()

    const fetchLiveData = useCallback(async () => {
        const { data: latest } = await supabase
            .from('queue_tokens')
            .select('*')
            .eq('id', token.id)
            .maybeSingle()

        if (latest) setToken(latest)

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
    }, [supabase, token.id, token.token_number, office.id])

    useEffect(() => {
        fetchLiveData()

        // Realtime subscription
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
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [office.id, token.id, fetchLiveData, supabase])

    const avgTime = (token as QueueToken & { departments?: { avg_service_time_mins: number } | null })
        .departments?.avg_service_time_mins ?? 5
    const estWait = (waitingAhead ?? 0) * avgTime
    const isYourTurn = token.status === 'serving'
    const isDone = token.status === 'served' || token.status === 'skipped'

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="page-container flex items-center gap-3 h-16">
                    <Link href={`/offices/${office.slug}`} className="btn-ghost p-2">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-bold text-slate-900">Q‑Pro</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </div>
                </div>
            </header>

            <div className="page-container py-10 max-w-xl">
                {/* Office name */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-slate-500 text-center mb-6"
                >
                    {office.name}
                </motion.p>

                {/* Alert for your turn */}
                <AnimatePresence>
                    {isYourTurn && (
                        <motion.div
                            initial={{ opacity: 0, y: -12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 rounded-2xl bg-brand-600 text-white text-center shadow-lg"
                        >
                            <div className="flex items-center justify-center gap-2 text-lg font-bold mb-1">
                                <Wifi className="w-5 h-5 animate-pulse" />
                                It&apos;s Your Turn!
                            </div>
                            <p className="text-brand-200 text-sm">Please proceed to the counter</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Token display */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="card text-center mb-6"
                >
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">Your Token</p>
                    <div className="flex justify-center mb-4">
                        <motion.div
                            key={token.status}
                            animate={isYourTurn ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ repeat: isYourTurn ? Infinity : 0, duration: 1.5 }}
                            className={`token-display ${isYourTurn ? 'from-emerald-500 to-emerald-700' : isDone ? 'from-slate-400 to-slate-500' : 'from-brand-500 to-brand-700'}`}
                        >
                            {formatTokenNumber(token.token_number)}
                        </motion.div>
                    </div>

                    <div className={`badge mx-auto mb-2 ${TOKEN_STATUS_COLORS[token.status]}`}>
                        {statusIcons[token.status]}
                        <span className="ml-1.5">{statusLabels[token.status]}</span>
                    </div>
                    <p className="text-sm text-slate-500">{token.user_name}</p>
                </motion.div>

                {/* Stats */}
                {!isDone && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <motion.div
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card text-center"
                        >
                            <div className="flex justify-center mb-2">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-amber-600" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mb-0.5">People Ahead</p>
                            <motion.p
                                key={waitingAhead}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-bold text-slate-900"
                            >
                                {waitingAhead ?? '—'}
                            </motion.p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                            className="card text-center"
                        >
                            <div className="flex justify-center mb-2">
                                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-brand-600" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mb-0.5">Est. Wait</p>
                            <motion.p
                                key={estWait}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-bold text-slate-900"
                            >
                                {waitingAhead === null ? '—' : estWait < 1 ? '<1m' : `~${Math.round(estWait)}m`}
                            </motion.p>
                        </motion.div>
                    </div>
                )}

                {/* Currently serving */}
                {currentServing && !isDone && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="card flex items-center justify-between mb-6"
                    >
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Now Serving</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5">{formatTokenNumber(currentServing)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                            <Wifi className="w-5 h-5 text-teal-600" />
                        </div>
                    </motion.div>
                )}

                {/* Done state */}
                {isDone && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card text-center"
                    >
                        {token.status === 'served' ? (
                            <>
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                                <h3 className="font-semibold text-slate-900">Service Completed</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Served at {token.served_at ? formatTime(token.served_at) : '—'}
                                </p>
                            </>
                        ) : (
                            <>
                                <SkipForward className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                <h3 className="font-semibold text-slate-900">Token Skipped</h3>
                                <p className="text-sm text-slate-500 mt-1">Please visit the counter for assistance</p>
                            </>
                        )}
                        <Link href={`/offices/${office.slug}`} className="btn-primary mt-4 w-full justify-center">
                            Join Again
                        </Link>
                    </motion.div>
                )}

                <p className="text-center text-xs text-slate-400 mt-8">
                    Updates automatically • Powered by Q-Pro
                </p>
            </div>
        </div>
    )
}

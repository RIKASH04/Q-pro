'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    Users, TicketCheck, CheckCircle2, SkipForward,
    PlayCircle, PauseCircle, XCircle, ChevronRight,
    Activity, ArrowRight, Clock, RefreshCw, QrCode,
    Copy, Download, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/ui/StatCard'
import { formatTokenNumber, formatTime } from '@/lib/utils'
import { TOKEN_STATUS_COLORS } from '@/lib/constants'
import type { Office, QueueToken, OfficeQueueState } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
    office: Office
    officeId: string
    stats: { totalToday: number; waiting: number; served: number; skipped: number }
    queueState: OfficeQueueState | null
    recentTokens: QueueToken[]
}

export default function OfficeDashboardClient({ office, officeId, stats: initStats, queueState: initState, recentTokens: initTokens }: Props) {
    const [stats, setStats] = useState(initStats)
    const [queueState, setQueueState] = useState(initState)
    const [recentTokens, setRecentTokens] = useState(initTokens)
    const [currentServing, setCurrentServing] = useState<QueueToken | null>(null)
    const [loading, setLoading] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const qrRef = useRef<SVGSVGElement>(null)
    const supabase = createClient()

    const joinUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/offices/${office?.slug}` 
        : ''

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy!', err)
        }
    }

    const downloadQR = () => {
        if (!qrRef.current) return
        
        const svg = qrRef.current
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
            canvas.width = img.width + 40 // Add padding
            canvas.height = img.height + 40
            if (ctx) {
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 20, 20)
                const pngFile = canvas.toDataURL('image/png')
                const downloadLink = document.createElement('a')
                downloadLink.download = `QR-${office?.name || 'office'}.png`
                downloadLink.href = pngFile
                downloadLink.click()
            }
        }
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }

    const fetchStats = useCallback(async () => {
        const today = new Date().toISOString().slice(0, 10)
        const [
            { count: totalToday },
            { count: waiting },
            { count: served },
            { count: skipped },
        ] = await Promise.all([
            supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('office_id', officeId).gte('joined_at', `${today}T00:00:00`),
            supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('office_id', officeId).eq('status', 'waiting'),
            supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('office_id', officeId).eq('status', 'served').gte('joined_at', `${today}T00:00:00`),
            supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('office_id', officeId).eq('status', 'skipped').gte('joined_at', `${today}T00:00:00`),
        ])
        setStats({ totalToday: totalToday ?? 0, waiting: waiting ?? 0, served: served ?? 0, skipped: skipped ?? 0 })
    }, [supabase, officeId])

    const fetchCurrentServing = useCallback(async () => {
        const { data } = await supabase
            .from('queue_tokens')
            .select('*')
            .eq('office_id', officeId)
            .eq('status', 'serving')
            .order('token_number', { ascending: false })
            .limit(1)
            .maybeSingle()
        setCurrentServing(data)
    }, [supabase, officeId])

    const fetchRecent = useCallback(async () => {
        const { data } = await supabase
            .from('queue_tokens')
            .select('*')
            .eq('office_id', officeId)
            .order('joined_at', { ascending: false })
            .limit(5)
        setRecentTokens(data ?? [])
    }, [supabase, officeId])

    useEffect(() => {
        fetchCurrentServing()

        const channel = supabase
            .channel(`dashboard-${officeId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tokens', filter: `office_id=eq.${officeId}` }, () => {
                fetchStats()
                fetchCurrentServing()
                fetchRecent()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'office_queue_state', filter: `office_id=eq.${officeId}` }, payload => {
                if (payload.new) setQueueState(payload.new as OfficeQueueState)
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [officeId, supabase, fetchStats, fetchCurrentServing, fetchRecent])

    const handleServeNext = async () => {
        setLoading('serve')
        // Mark current serving as served
        if (currentServing) {
            await supabase.from('queue_tokens').update({ status: 'served', served_at: new Date().toISOString() }).eq('id', currentServing.id)
        }
        // Get next waiting token
        const { data: next } = await supabase
            .from('queue_tokens')
            .select('*')
            .eq('office_id', officeId)
            .eq('status', 'waiting')
            .order('token_number', { ascending: true })
            .limit(1)
            .single()

        if (next) {
            await supabase.from('queue_tokens').update({ status: 'serving' }).eq('id', next.id)
            await supabase.from('office_queue_state').upsert({ office_id: officeId, current_token: next.token_number, updated_at: new Date().toISOString() }, { onConflict: 'office_id' })
        }
        await fetchCurrentServing()
        await fetchStats()
        setLoading(null)
    }

    const handleSkip = async () => {
        if (!currentServing) return
        setLoading('skip')
        await supabase.from('queue_tokens').update({ status: 'skipped' }).eq('id', currentServing.id)

        const { data: next } = await supabase
            .from('queue_tokens')
            .select('*')
            .eq('office_id', officeId)
            .eq('status', 'waiting')
            .order('token_number', { ascending: true })
            .limit(1)
            .single()

        if (next) {
            await supabase.from('queue_tokens').update({ status: 'serving' }).eq('id', next.id)
            await supabase.from('office_queue_state').upsert({ office_id: officeId, current_token: next.token_number, updated_at: new Date().toISOString() }, { onConflict: 'office_id' })
        } else {
            setCurrentServing(null)
        }
        await fetchStats()
        setLoading(null)
    }

    const handlePauseToggle = async () => {
        const newPaused = !queueState?.is_paused
        await supabase.from('office_queue_state').upsert({
            office_id: officeId,
            is_paused: newPaused,
            is_closed: queueState?.is_closed ?? false,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'office_id' })
        setQueueState(prev => prev ? { ...prev, is_paused: newPaused } : null)
    }

    const handleCloseToggle = async () => {
        const newClosed = !queueState?.is_closed
        await supabase.from('office_queue_state').upsert({
            office_id: officeId,
            is_closed: newClosed,
            is_paused: queueState?.is_paused ?? false,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'office_id' })
        setQueueState(prev => prev ? { ...prev, is_closed: newClosed } : null)
    }

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="section-title">{office?.name ?? 'Office Dashboard'}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${queueState?.is_closed ? 'bg-red-50 text-red-600 border-red-200' :
                                queueState?.is_paused ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${queueState?.is_closed ? 'bg-red-500' :
                                    queueState?.is_paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                                }`} />
                            {queueState?.is_closed ? 'Closed' : queueState?.is_paused ? 'Paused' : 'Active'}
                        </div>
                    </div>
                </div>
                <Link href={`/offices/${office?.slug}`} target="_blank" className="btn-secondary">
                    Public Page
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard index={0} title="Today's Total" value={stats.totalToday} icon={<TicketCheck className="w-5 h-5" />} color="blue" />
                <StatCard index={1} title="Waiting" value={stats.waiting} icon={<Users className="w-5 h-5" />} color="amber" />
                <StatCard index={2} title="Served" value={stats.served} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
                <StatCard index={3} title="Skipped" value={stats.skipped} icon={<SkipForward className="w-5 h-5" />} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Queue Control */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card lg:col-span-2"
                >
                    <h2 className="font-semibold text-slate-900 mb-5">Queue Control</h2>

                    {/* Currently Serving */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-200 mb-5 text-center">
                        <p className="text-xs text-brand-600 uppercase tracking-wider font-semibold mb-2">Now Serving</p>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentServing?.token_number ?? 'none'}
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.85, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md ${currentServing ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-slate-200 text-slate-500'
                                    }`}
                            >
                                {currentServing ? formatTokenNumber(currentServing.token_number) : '—'}
                            </motion.div>
                        </AnimatePresence>
                        {currentServing && (
                            <p className="text-xs text-brand-700 mt-2 font-medium">{currentServing.user_name}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <button
                            onClick={handleServeNext}
                            disabled={!!loading || !!queueState?.is_closed || stats.waiting === 0}
                            className="btn-success w-full py-3 disabled:opacity-50"
                            id="serve-next-btn"
                        >
                            {loading === 'serve' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                            Serve Next
                        </button>
                        <button
                            onClick={handleSkip}
                            disabled={!currentServing || !!loading}
                            className="btn-secondary w-full py-2.5 disabled:opacity-50"
                            id="skip-btn"
                        >
                            <SkipForward className="w-4 h-4" />
                            Skip Token
                        </button>
                        <button
                            onClick={handlePauseToggle}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all duration-150 ${queueState?.is_paused
                                    ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            id="pause-btn"
                        >
                            {queueState?.is_paused
                                ? <><PlayCircle className="w-4 h-4" /> Resume Queue</>
                                : <><PauseCircle className="w-4 h-4" /> Pause Queue</>
                            }
                        </button>
                        <button
                            onClick={handleCloseToggle}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all duration-150 ${queueState?.is_closed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'
                                }`}
                            id="close-queue-btn"
                        >
                            <XCircle className="w-4 h-4" />
                            {queueState?.is_closed ? 'Reopen Queue' : 'Close Queue'}
                        </button>
                    </div>

                    {/* Queue Actions */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <Link href="/office-admin/queue" className="btn-primary w-full py-2.5">
                            <TicketCheck className="w-4 h-4" />
                            Manage Full Queue
                        </Link>
                    </div>
                </motion.div>

                {/* QR Code Section */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="card lg:col-span-3 flex flex-col items-center justify-center text-center p-8"
                >
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                        <QrCode className="w-6 h-6 text-brand-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">QR Code for Queue</h2>
                    <p className="text-sm text-slate-500 mb-8 max-w-sm">
                        Display this QR code at your office. Customers can scan it to join the queue directly from their phones.
                    </p>

                    <div className="p-6 rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
                        <QRCodeSVG
                            id="office-qr"
                            value={joinUrl}
                            size={200}
                            level="H"
                            includeMargin={false}
                            ref={qrRef}
                        />
                    </div>

                    <div className="w-full max-w-md space-y-3">
                        <div className="flex items-center gap-2 p-1.5 pl-4 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-xs font-medium text-slate-400 truncate flex-1 text-left">
                                {joinUrl}
                            </span>
                            <button
                                onClick={copyToClipboard}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                                }`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>

                        <button
                            onClick={downloadQR}
                            className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download QR Code (PNG)
                        </button>
                    </div>
                </motion.div>

                {/* Recent Tokens */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card lg:col-span-5"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-slate-900">Recent Tokens</h2>
                        <Link href="/office-admin/queue" className="text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1">
                            View all <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    {recentTokens.length === 0 ? (
                        <div className="text-center py-10">
                            <TicketCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No tokens yet today</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {recentTokens.map((t, i) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.45 + i * 0.05 }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${t.status === 'serving' ? 'bg-gradient-to-br from-brand-500 to-brand-700' :
                                            t.status === 'served' ? 'bg-emerald-500' :
                                                t.status === 'skipped' ? 'bg-slate-400' :
                                                    'bg-amber-400'
                                        }`}>
                                        {formatTokenNumber(t.token_number)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{t.user_name}</p>
                                        <p className="text-xs text-slate-500">{formatTime(t.joined_at)}</p>
                                    </div>
                                    <span className={`badge flex-shrink-0 ${TOKEN_STATUS_COLORS[t.status]}`}>
                                        {t.status}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

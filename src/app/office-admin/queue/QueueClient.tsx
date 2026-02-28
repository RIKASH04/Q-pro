'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, TicketCheck, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TOKEN_STATUS_COLORS } from '@/lib/constants'
import { formatTokenNumber, formatTime } from '@/lib/utils'
import type { QueueToken } from '@/lib/types'

interface Props {
    officeId: string
    initialTokens: (QueueToken & { departments?: { name: string } | null })[]
}

const statusOptions = ['all', 'waiting', 'serving', 'served', 'skipped'] as const

export default function QueueClient({ officeId, initialTokens }: Props) {
    const [tokens, setTokens] = useState(initialTokens)
    const [filter, setFilter] = useState<string>('all')
    const [search, setSearch] = useState('')
    const [dateFilter, setDateFilter] = useState<string>(() => new Date().toISOString().slice(0, 10))
    const supabase = createClient()

    const refetch = useCallback(async () => {
        const query = supabase
            .from('queue_tokens')
            .select('*, departments(name)')
            .eq('office_id', officeId)
            .gte('joined_at', `${dateFilter}T00:00:00`)
            .lte('joined_at', `${dateFilter}T23:59:59`)
            .order('token_number', { ascending: true })

        const { data } = await query
        setTokens(data ?? [])
    }, [supabase, officeId, dateFilter])

    useEffect(() => {
        refetch()

        const channel = supabase
            .channel(`queue-page-${officeId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tokens', filter: `office_id=eq.${officeId}` }, () => refetch())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [officeId, supabase, refetch])

    const filtered = tokens.filter(t => {
        const matchStatus = filter === 'all' || t.status === filter
        const matchSearch = t.user_name.toLowerCase().includes(search.toLowerCase()) ||
            String(t.token_number).includes(search)
        return matchStatus && matchSearch
    })

    const counts = {
        all: tokens.length,
        waiting: tokens.filter(t => t.status === 'waiting').length,
        serving: tokens.filter(t => t.status === 'serving').length,
        served: tokens.filter(t => t.status === 'served').length,
        skipped: tokens.filter(t => t.status === 'skipped').length,
    }

    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="section-title">Queue Management</h1>
                <p className="section-subtitle">All tokens for your office</p>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-3 mb-6"
            >
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name or token..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="input w-auto"
                />
            </motion.div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-thin pb-1">
                {statusOptions.map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${filter === s
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                            {counts[s as keyof typeof counts]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Queue Table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card p-0 overflow-hidden"
            >
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <TicketCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No tokens for this filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {['Token', 'Name', 'Phone', 'Department', 'Joined', 'Wait', 'Status'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence>
                                    {filtered.map((t, i) => (
                                        <motion.tr
                                            key={t.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: i * 0.025 }}
                                            className={`hover:bg-slate-50/50 transition-colors ${t.status === 'serving' ? 'bg-brand-50/30' : ''}`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${t.status === 'serving' ? 'bg-gradient-to-br from-brand-500 to-brand-700' :
                                                        t.status === 'served' ? 'bg-emerald-500' :
                                                            t.status === 'skipped' ? 'bg-slate-400' : 'bg-amber-400'
                                                    }`}>
                                                    {formatTokenNumber(t.token_number)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-medium text-slate-800 text-sm">{t.user_name}</td>
                                            <td className="px-5 py-3.5 text-sm text-slate-500">{t.user_phone ?? '—'}</td>
                                            <td className="px-5 py-3.5 text-sm text-slate-500">
                                                {(t as any).departments?.name ?? 'General'}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatTime(t.joined_at)}</td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500">
                                                {t.estimated_wait_mins < 1 ? '<1m' : `${t.estimated_wait_mins}m`}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`badge ${TOKEN_STATUS_COLORS[t.status]}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

'use client'

import { motion } from 'framer-motion'
import {
    BarChart3, Building2, TicketCheck, Clock,
    TrendingUp, Users, Activity
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'

interface Props {
    stats: {
        totalOffices: number
        totalTokens: number
        todayTokens: number
        servedToday: number
        waitingNow: number
    }
}

export default function AnalyticsClient({ stats }: Props) {
    const servedRate = stats.todayTokens > 0
        ? Math.round((stats.servedToday / stats.todayTokens) * 100)
        : 0

    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="section-title">Platform Analytics</h1>
                <p className="section-subtitle">Real-time statistics across all offices</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard index={0} title="Active Offices" value={stats.totalOffices} icon={<Building2 className="w-5 h-5" />} color="blue" />
                <StatCard index={1} title="All-Time Tokens" value={stats.totalTokens.toLocaleString()} icon={<TicketCheck className="w-5 h-5" />} color="teal" />
                <StatCard index={2} title="Today's Tokens" value={stats.todayTokens} icon={<Activity className="w-5 h-5" />} color="amber" />
                <StatCard index={3} title="Served Today" value={stats.servedToday} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
                <StatCard index={4} title="Currently Waiting" value={stats.waitingNow} icon={<Clock className="w-5 h-5" />} color="violet" subtitle="Across all offices" />
                <StatCard index={5} title="Service Rate" value={`${servedRate}%`} icon={<BarChart3 className="w-5 h-5" />} color="rose" subtitle="Today" />
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card"
                >
                    <h2 className="font-semibold text-slate-900 mb-4">Today&apos;s Summary</h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Total Tokens Issued', value: stats.todayTokens, color: 'text-brand-600' },
                            { label: 'Served', value: stats.servedToday, color: 'text-emerald-600' },
                            { label: 'Still Waiting', value: stats.waitingNow, color: 'text-amber-600' },
                            { label: 'Pending / Other', value: Math.max(0, stats.todayTokens - stats.servedToday - stats.waitingNow), color: 'text-slate-500' },
                        ].map(r => (
                            <div key={r.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <span className="text-sm text-slate-600">{r.label}</span>
                                <span className={`font-bold text-base ${r.color}`}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card"
                >
                    <h2 className="font-semibold text-slate-900 mb-4">Platform Health</h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Database Status', status: 'Operational', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Realtime Events', status: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Auth Service', status: 'Running', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Queue Processing', status: 'Normal', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <span className="text-sm text-slate-600">{s.label}</span>
                                <span className={`badge ${s.bg} ${s.color} border-0`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                    {s.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

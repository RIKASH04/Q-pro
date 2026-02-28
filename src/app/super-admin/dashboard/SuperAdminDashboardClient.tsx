'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Building2, Users, TicketCheck, TrendingUp,
    ArrowRight, Plus, Activity
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { OFFICE_TYPE_ICONS, OFFICE_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Office } from '@/lib/types'

interface Props {
    stats: {
        offices: number
        totalTokens: number
        adminUsers: number
        todayTokens: number
    }
    recentOffices: Office[]
}

export default function SuperAdminDashboardClient({ stats, recentOffices }: Props) {
    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="section-title">Platform Overview</h1>
                        <p className="section-subtitle">Q-Pro Super Admin Dashboard</p>
                    </div>
                    <Link href="/super-admin/offices/new" className="btn-primary" id="create-office-btn">
                        <Plus className="w-4 h-4" />
                        New Office
                    </Link>
                </div>

                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Activity className="w-3 h-3" />
                    All systems operational
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    index={0}
                    title="Total Offices"
                    value={stats.offices}
                    icon={<Building2 className="w-5 h-5" />}
                    color="blue"
                    subtitle="All registered offices"
                />
                <StatCard
                    index={1}
                    title="Today's Tokens"
                    value={stats.todayTokens}
                    icon={<TicketCheck className="w-5 h-5" />}
                    color="teal"
                    subtitle="Issued today"
                />
                <StatCard
                    index={2}
                    title="Admin Users"
                    value={stats.adminUsers}
                    icon={<Users className="w-5 h-5" />}
                    color="violet"
                    subtitle="Office admins"
                />
                <StatCard
                    index={3}
                    title="Total Tokens"
                    value={stats.totalTokens.toLocaleString()}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="emerald"
                    subtitle="All-time issued"
                />
            </div>

            {/* Recent Offices */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-slate-900">Recent Offices</h2>
                    <Link href="/super-admin/offices" className="text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1">
                        View all <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {recentOffices.length === 0 ? (
                    <div className="text-center py-10">
                        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No offices yet</p>
                        <Link href="/super-admin/offices/new" className="btn-primary mt-4">
                            Create First Office
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentOffices.map((office, i) => (
                            <motion.div
                                key={office.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + i * 0.06 }}
                            >
                                <Link
                                    href={`/super-admin/offices/${office.id}`}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                                        {OFFICE_TYPE_ICONS[office.type] ?? '🏢'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 text-sm truncate group-hover:text-brand-700 transition-colors">
                                            {office.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {OFFICE_TYPE_LABELS[office.type] ?? office.type} · Created {formatDate(office.created_at)}
                                        </p>
                                    </div>
                                    <span className={`badge flex-shrink-0 ${office.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        {office.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors flex-shrink-0" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}

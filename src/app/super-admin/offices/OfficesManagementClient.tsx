'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Building2, Plus, Search, ArrowRight, Trash2,
    ToggleLeft, ToggleRight, Edit3
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OFFICE_TYPE_ICONS, OFFICE_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Office } from '@/lib/types'

interface Props {
    offices: Office[]
}

export default function OfficesManagementClient({ offices: initial }: Props) {
    const [offices, setOffices] = useState(initial)
    const [query, setQuery] = useState('')
    const [deleting, setDeleting] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const filtered = offices.filter(o =>
        o.name.toLowerCase().includes(query.toLowerCase()) ||
        (o.address ?? '').toLowerCase().includes(query.toLowerCase())
    )

    const handleToggleActive = async (id: string, current: boolean) => {
        await supabase.from('offices').update({ is_active: !current }).eq('id', id)
        setOffices(prev => prev.map(o => o.id === id ? { ...o, is_active: !current } : o))
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this office? All associated queue data will be removed.')) return
        setDeleting(id)
        await supabase.from('offices').delete().eq('id', id)
        setOffices(prev => prev.filter(o => o.id !== id))
        setDeleting(null)
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
                    <h1 className="section-title">Offices</h1>
                    <p className="section-subtitle">{offices.length} registered offices</p>
                </div>
                <Link href="/super-admin/offices/new" className="btn-primary" id="new-office-btn">
                    <Plus className="w-4 h-4" />
                    Create Office
                </Link>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative mb-6 max-w-sm"
            >
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search offices..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="input pl-10"
                    id="office-search-admin"
                />
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card p-0 overflow-hidden"
            >
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No offices found</p>
                        <Link href="/super-admin/offices/new" className="btn-primary mt-4">
                            Create First Office
                        </Link>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Office', 'Type', 'Address', 'Created', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((office, i) => (
                                <motion.tr
                                    key={office.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-lg flex-shrink-0">
                                                {OFFICE_TYPE_ICONS[office.type] ?? '🏢'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate max-w-[180px]">{office.name}</p>
                                                <p className="text-xs text-slate-400">/{office.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">
                                        {OFFICE_TYPE_LABELS[office.type] ?? office.type}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-slate-500 max-w-[160px] block truncate">
                                            {office.address ?? '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-500">{formatDate(office.created_at)}</td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => handleToggleActive(office.id, office.is_active)}
                                            className="flex items-center gap-1.5"
                                        >
                                            {office.is_active ? (
                                                <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-xs text-emerald-600 font-medium">Active</span></>
                                            ) : (
                                                <><ToggleLeft className="w-5 h-5 text-slate-400" /><span className="text-xs text-slate-500 font-medium">Inactive</span></>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <Link
                                                href={`/super-admin/offices/${office.id}`}
                                                className="p-2 rounded-lg hover:bg-brand-50 text-slate-500 hover:text-brand-600 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(office.id)}
                                                disabled={deleting === office.id}
                                                className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>
        </div>
    )
}

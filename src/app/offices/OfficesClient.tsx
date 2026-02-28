'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, MapPin, Phone, ArrowRight, Layers, ChevronLeft, Building2 } from 'lucide-react'
import { OFFICE_TYPE_LABELS, OFFICE_TYPE_ICONS } from '@/lib/constants'
import type { Office } from '@/lib/types'

interface Props {
    offices: Office[]
}

export default function OfficesClient({ offices }: Props) {
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const types = ['all', ...Array.from(new Set(offices.map(o => o.type)))]

    const filtered = offices.filter(o => {
        const matchQuery =
            o.name.toLowerCase().includes(query.toLowerCase()) ||
            (o.address ?? '').toLowerCase().includes(query.toLowerCase())
        const matchType = typeFilter === 'all' || o.type === typeFilter
        return matchQuery && matchType
    })

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
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
                    <Link href="/auth/login" className="btn-secondary text-xs py-2">
                        Admin Login
                    </Link>
                </div>
            </header>

            <div className="page-container py-10">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-slate-900">Select an Office</h1>
                    <p className="text-slate-500 mt-1">Choose an office to join the digital queue</p>
                </motion.div>

                {/* Search + Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col sm:flex-row gap-3 mb-8"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or address..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="input pl-10"
                            id="office-search"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
                        {types.map(t => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${typeFilter === t
                                        ? 'bg-brand-600 text-white border-brand-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {t === 'all' ? 'All Types' : `${OFFICE_TYPE_ICONS[t] ?? '🏢'} ${OFFICE_TYPE_LABELS[t] ?? t}`}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No offices found</p>
                        <p className="text-slate-400 text-sm mt-1">Try a different search or filter</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((office, i) => (
                            <motion.div
                                key={office.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: i * 0.05 }}
                            >
                                <Link
                                    href={`/offices/${office.slug}`}
                                    className="card-hover flex flex-col h-full group"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                                            {OFFICE_TYPE_ICONS[office.type] ?? '🏢'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                                                {office.name}
                                            </h2>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {OFFICE_TYPE_LABELS[office.type] ?? office.type}
                                            </span>
                                        </div>
                                    </div>

                                    {office.description && (
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{office.description}</p>
                                    )}

                                    <div className="mt-auto pt-3 border-t border-slate-50 space-y-1.5">
                                        {office.address && (
                                            <div className="flex items-start gap-2 text-xs text-slate-500">
                                                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                                                <span className="line-clamp-1">{office.address}</span>
                                            </div>
                                        )}
                                        {office.phone && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                                <span>{office.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200">Open</span>
                                        <span className="flex items-center gap-1 text-xs text-brand-600 font-semibold group-hover:gap-2 transition-all">
                                            Join Queue <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

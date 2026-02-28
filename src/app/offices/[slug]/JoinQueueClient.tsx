'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, Layers, MapPin, Phone, Clock, Users,
    CheckCircle2, AlertCircle, Loader2, User, Smartphone
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OFFICE_TYPE_ICONS, OFFICE_TYPE_LABELS } from '@/lib/constants'
import { formatTokenNumber } from '@/lib/utils'
import type { Office, Department, OfficeQueueState } from '@/lib/types'

interface Props {
    office: Office
    departments: Department[]
    queueState: OfficeQueueState | null
}

export default function JoinQueueClient({ office, departments, queueState }: Props) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [deptId, setDeptId] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState<{ tokenId: string; tokenNumber: number; waitMins: number } | null>(null)
    const router = useRouter()

    const isClosed = queueState?.is_closed
    const isPaused = queueState?.is_paused

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return setError('Please enter your name')
        setLoading(true)
        setError('')

        const supabase = createClient()

        // Get today's token count for this office
        const today = new Date().toISOString().slice(0, 10)
        const { count } = await supabase
            .from('queue_tokens')
            .select('id', { count: 'exact', head: true })
            .eq('office_id', office.id)
            .gte('joined_at', `${today}T00:00:00`)

        const tokenNumber = (count ?? 0) + 1

        // Get selected dept avg time
        const dept = departments.find(d => d.id === deptId)
        const avgTime = dept?.avg_service_time_mins ?? 5

        // Waiting count (people ahead)
        const { count: waitingCount } = await supabase
            .from('queue_tokens')
            .select('id', { count: 'exact', head: true })
            .eq('office_id', office.id)
            .eq('status', 'waiting')

        const waitMins = (waitingCount ?? 0) * avgTime

        const { data, error: insertErr } = await supabase
            .from('queue_tokens')
            .insert({
                office_id: office.id,
                department_id: deptId || null,
                token_number: tokenNumber,
                user_name: name.trim(),
                user_phone: phone.trim() || null,
                status: 'waiting',
                estimated_wait_mins: waitMins,
            })
            .select()
            .single()

        if (insertErr || !data) {
            setError(insertErr?.message ?? 'Failed to join queue. Please try again.')
            setLoading(false)
            return
        }

        setSuccess({ tokenId: data.id, tokenNumber: data.token_number, waitMins })
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="page-container flex items-center gap-3 h-16">
                    <Link href="/offices" className="btn-ghost p-2">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-bold text-slate-900">Q‑Pro</span>
                    </div>
                </div>
            </header>

            <div className="page-container py-10 max-w-2xl">
                {/* Office info */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card mb-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl flex-shrink-0">
                            {OFFICE_TYPE_ICONS[office.type] ?? '🏢'}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{office.name}</h1>
                            <p className="text-sm text-slate-500">{OFFICE_TYPE_LABELS[office.type] ?? office.type}</p>
                            {office.description && (
                                <p className="text-sm text-slate-600 mt-1">{office.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2">
                                {office.address && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <MapPin className="w-3 h-3" /> {office.address}
                                    </span>
                                )}
                                {office.phone && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <Phone className="w-3 h-3" /> {office.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    {isClosed && (
                        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                            <AlertCircle className="w-4 h-4" /> Queue is currently closed
                        </div>
                    )}
                    {!isClosed && isPaused && (
                        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                            <AlertCircle className="w-4 h-4" /> Queue is temporarily paused
                        </div>
                    )}
                </motion.div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="card text-center"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>

                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">You&apos;re in the queue!</h2>
                            <p className="text-slate-500 text-sm mb-6">Your token has been generated</p>

                            <div className="flex justify-center mb-6">
                                <div className="token-display">
                                    {formatTokenNumber(success.tokenNumber)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Est. Wait Time</p>
                                    <p className="font-semibold text-slate-900 text-sm">
                                        {success.waitMins < 1 ? '<1 min' : `~${Math.round(success.waitMins)} min`}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Token No.</p>
                                    <p className="font-semibold text-slate-900 text-sm">{formatTokenNumber(success.tokenNumber)}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/offices/${office.slug}/token/${success.tokenId}`)}
                                className="btn-primary w-full py-3"
                            >
                                Track Live Status
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="card"
                        >
                            <h2 className="text-lg font-semibold text-slate-900 mb-1">Join the Queue</h2>
                            <p className="text-sm text-slate-500 mb-6">Fill in your details to get a token</p>

                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="label" htmlFor="user-name">Your Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            id="user-name"
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                            className="input pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label" htmlFor="user-phone">
                                        Phone Number <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            id="user-phone"
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="input pl-10"
                                        />
                                    </div>
                                </div>

                                {departments.length > 0 && (
                                    <div>
                                        <label className="label" htmlFor="dept-select">Department / Service</label>
                                        <select
                                            id="dept-select"
                                            value={deptId}
                                            onChange={e => setDeptId(e.target.value)}
                                            className="input"
                                        >
                                            <option value="">— Select department (optional) —</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} (~{d.avg_service_time_mins} min)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !!isClosed}
                                    className="btn-primary w-full py-3 text-base disabled:opacity-60"
                                    id="join-queue-btn"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating Token...</>
                                    ) : (
                                        'Get My Token'
                                    )}
                                </button>

                                {isClosed && (
                                    <p className="text-center text-xs text-red-500">Queue is closed. Please come back later.</p>
                                )}
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

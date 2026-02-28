'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Building2, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import type { OfficeType } from '@/lib/types'

const officeTypes: { value: OfficeType; label: string; icon: string }[] = [
    { value: 'hospital', label: 'Hospital', icon: '🏥' },
    { value: 'government', label: 'Government Office', icon: '🏛️' },
    { value: 'post_office', label: 'Post Office', icon: '📮' },
    { value: 'ration_shop', label: 'Ration Shop', icon: '🏬' },
    { value: 'aadhaar_center', label: 'Aadhaar Center', icon: '🪪' },
    { value: 'other', label: 'Other', icon: '🏢' },
]

export default function NewOfficePage() {
    const [form, setForm] = useState({
        name: '',
        type: 'hospital' as OfficeType,
        description: '',
        address: '',
        phone: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return setError('Office name is required')
        setLoading(true)
        setError('')

        const slug = slugify(form.name)
        const { error: insertErr } = await supabase.from('offices').insert({
            name: form.name.trim(),
            slug,
            type: form.type,
            description: form.description.trim() || null,
            address: form.address.trim() || null,
            phone: form.phone.trim() || null,
            is_active: true,
        })

        if (insertErr) {
            setError(insertErr.message)
            setLoading(false)
            return
        }

        router.push('/super-admin/offices')
        router.refresh()
    }

    return (
        <div className="p-8 max-w-2xl">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <Link href="/super-admin/offices" className="btn-ghost p-2 mb-4 inline-flex">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="section-title">Create New Office</h1>
                <p className="section-subtitle">Register a new office on the Q-Pro platform</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
            >
                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="label" htmlFor="office-name">Office Name *</label>
                        <input
                            id="office-name"
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. City General Hospital"
                            required
                            className="input"
                        />
                        {form.name && (
                            <p className="text-xs text-slate-400 mt-1.5">
                                URL slug: <span className="font-mono text-brand-600">/{slugify(form.name)}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="label">Office Type *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {officeTypes.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${form.type === t.value
                                            ? 'bg-brand-50 border-brand-300 text-brand-700'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <span>{t.icon}</span>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="label" htmlFor="office-desc">Description</label>
                        <textarea
                            id="office-desc"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Brief description of this office..."
                            rows={3}
                            className="input resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label" htmlFor="office-addr">Address</label>
                            <input
                                id="office-addr"
                                type="text"
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="123, Main Street, City"
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="office-phone">Phone</label>
                            <input
                                id="office-phone"
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="+91 98765 43210"
                                className="input"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            id="create-office-submit"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                            ) : (
                                <><Building2 className="w-4 h-4" /> Create Office</>
                            )}
                        </button>
                        <Link href="/super-admin/offices" className="btn-secondary">
                            Cancel
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

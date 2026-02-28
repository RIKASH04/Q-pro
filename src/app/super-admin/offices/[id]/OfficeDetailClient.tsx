'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, Plus, Trash2, Users, Layers,
    Clock, Save, Loader2, ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OFFICE_TYPE_ICONS, OFFICE_TYPE_LABELS } from '@/lib/constants'
import type { Office, Department } from '@/lib/types'

interface Props {
    office: Office
    departments: Department[]
    admins: any[]
}

export default function OfficeDetailClient({ office, departments: initDepts, admins }: Props) {
    const [departments, setDepartments] = useState(initDepts)
    const [newDeptName, setNewDeptName] = useState('')
    const [newDeptTime, setNewDeptTime] = useState('5')
    const [adminEmail, setAdminEmail] = useState('')
    const [saving, setSaving] = useState(false)
    const [addingDept, setAddingDept] = useState(false)
    const [assigningAdmin, setAssigningAdmin] = useState(false)
    const [msg, setMsg] = useState('')
    const supabase = createClient()
    const router = useRouter()

    const handleAddDept = async () => {
        if (!newDeptName.trim()) return
        setAddingDept(true)
        const { data, error } = await supabase.from('departments').insert({
            office_id: office.id,
            name: newDeptName.trim(),
            avg_service_time_mins: parseInt(newDeptTime) || 5,
            is_active: true,
        }).select().single()

        if (!error && data) {
            setDepartments(prev => [...prev, data])
            setNewDeptName('')
            setNewDeptTime('5')
        }
        setAddingDept(false)
    }

    const handleDeleteDept = async (id: string) => {
        await supabase.from('departments').delete().eq('id', id)
        setDepartments(prev => prev.filter(d => d.id !== id))
    }

    const handleAssignAdmin = async () => {
        if (!adminEmail.trim()) return
        setAssigningAdmin(true)
        setMsg('')

        // Look up user by email via our API
        const res = await fetch('/api/assign-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, officeId: office.id }),
        })
        const data = await res.json()

        if (res.ok) {
            setMsg(`✅ Admin assigned successfully!`)
            setAdminEmail('')
            router.refresh()
        } else {
            setMsg(`❌ ${data.error}`)
        }
        setAssigningAdmin(false)
    }

    return (
        <div className="p-8 max-w-3xl">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <Link href="/super-admin/offices" className="btn-ghost p-2 mb-4 inline-flex">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl">
                        {OFFICE_TYPE_ICONS[office.type] ?? '🏢'}
                    </div>
                    <div>
                        <h1 className="section-title">{office.name}</h1>
                        <p className="section-subtitle">{OFFICE_TYPE_LABELS[office.type]} · /{office.slug}</p>
                    </div>
                    <Link
                        href={`/offices/${office.slug}`}
                        target="_blank"
                        className="btn-secondary ml-auto"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Public Page
                    </Link>
                </div>
            </motion.div>

            <div className="space-y-6">
                {/* Departments */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-teal-600" />
                        </div>
                        <h2 className="font-semibold text-slate-900">Departments</h2>
                        <span className="badge bg-slate-50 text-slate-500 border-slate-200 ml-auto">
                            {departments.length}
                        </span>
                    </div>

                    {departments.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {departments.map(d => (
                                <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800">{d.name}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" /> Avg. {d.avg_service_time_mins} min
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDept(d.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newDeptName}
                            onChange={e => setNewDeptName(e.target.value)}
                            placeholder="Department name"
                            className="input flex-1"
                            onKeyDown={e => e.key === 'Enter' && handleAddDept()}
                        />
                        <input
                            type="number"
                            value={newDeptTime}
                            onChange={e => setNewDeptTime(e.target.value)}
                            min={1}
                            max={120}
                            className="input w-20"
                            title="Avg service time (minutes)"
                        />
                        <button
                            onClick={handleAddDept}
                            disabled={addingDept}
                            className="btn-primary px-3"
                        >
                            {addingDept ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Enter name + avg. service time (mins) then click Add</p>
                </motion.div>

                {/* Assign Admin */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Users className="w-4 h-4 text-violet-600" />
                        </div>
                        <h2 className="font-semibold text-slate-900">Office Admins</h2>
                    </div>

                    {admins.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {admins.map((a: any) => (
                                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50">
                                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                                        <span className="text-violet-600 text-xs font-bold">
                                            {(a.auth_user?.email?.[0] ?? '?').toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700">{a.auth_user?.email ?? 'Unknown'}</p>
                                    <span className="badge bg-violet-50 text-violet-700 border-violet-200 ml-auto">Admin</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {msg && (
                        <p className="text-sm mb-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200">
                            {msg}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={adminEmail}
                            onChange={e => setAdminEmail(e.target.value)}
                            placeholder="admin@example.com"
                            className="input flex-1"
                        />
                        <button
                            onClick={handleAssignAdmin}
                            disabled={assigningAdmin}
                            className="btn-primary"
                        >
                            {assigningAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                        User must have an existing Q-Pro account before being assigned as admin
                    </p>
                </motion.div>
            </div>
        </div>
    )
}

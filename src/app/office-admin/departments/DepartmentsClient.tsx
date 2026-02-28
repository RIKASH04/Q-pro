'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Clock, Layers, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Department, Office } from '@/lib/types'

interface Props {
    officeId: string
    office: Office
    departments: Department[]
}

export default function DepartmentsClient({ officeId, office, departments: initial }: Props) {
    const [departments, setDepartments] = useState(initial)
    const [newName, setNewName] = useState('')
    const [newTime, setNewTime] = useState('5')
    const [adding, setAdding] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const supabase = createClient()

    const handleAdd = async () => {
        if (!newName.trim()) return
        setAdding(true)
        const { data, error } = await supabase.from('departments').insert({
            office_id: officeId,
            name: newName.trim(),
            avg_service_time_mins: parseInt(newTime) || 5,
            is_active: true,
        }).select().single()
        if (!error && data) {
            setDepartments(prev => [...prev, data])
            setNewName('')
            setNewTime('5')
        }
        setAdding(false)
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        await supabase.from('departments').delete().eq('id', id)
        setDepartments(prev => prev.filter(d => d.id !== id))
        setDeleting(null)
    }

    const handleToggle = async (id: string, current: boolean) => {
        await supabase.from('departments').update({ is_active: !current }).eq('id', id)
        setDepartments(prev => prev.map(d => d.id === id ? { ...d, is_active: !current } : d))
    }

    const handleUpdateTime = async (id: string, time: number) => {
        await supabase.from('departments').update({ avg_service_time_mins: time }).eq('id', id)
        setDepartments(prev => prev.map(d => d.id === id ? { ...d, avg_service_time_mins: time } : d))
    }

    return (
        <div className="p-8 max-w-2xl">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="section-title">Departments</h1>
                <p className="section-subtitle">Manage departments for {office?.name}</p>
            </motion.div>

            {/* Add new */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card mb-6"
            >
                <h2 className="font-semibold text-slate-900 mb-4">Add Department</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Department name"
                        className="input flex-1"
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="number"
                            value={newTime}
                            onChange={e => setNewTime(e.target.value)}
                            min={1} max={120}
                            className="input pl-8 w-24"
                            title="Avg service time in minutes"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={adding || !newName.trim()}
                        className="btn-primary disabled:opacity-50"
                    >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Second field is average service time in minutes</p>
            </motion.div>

            {/* Department list */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
            >
                <div className="flex items-center gap-2 mb-5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <h2 className="font-semibold text-slate-900">Active Departments</h2>
                    <span className="badge bg-slate-50 text-slate-500 border-slate-200 ml-auto">{departments.length}</span>
                </div>

                {departments.length === 0 ? (
                    <div className="text-center py-10">
                        <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No departments yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {departments.map((d, i) => (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 + i * 0.05 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 group"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${d.is_active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                        {d.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <input
                                        type="number"
                                        value={d.avg_service_time_mins}
                                        onChange={e => handleUpdateTime(d.id, parseInt(e.target.value) || 5)}
                                        min={1} max={120}
                                        className="w-12 text-center bg-white border border-slate-200 rounded-lg py-1 text-xs"
                                    />
                                    <span>min</span>
                                </div>
                                <button
                                    onClick={() => handleToggle(d.id, d.is_active)}
                                    className="text-slate-400 hover:text-brand-600 transition-colors"
                                >
                                    {d.is_active
                                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                                        : <ToggleLeft className="w-5 h-5 text-slate-300" />
                                    }
                                </button>
                                <button
                                    onClick={() => handleDelete(d.id)}
                                    disabled={deleting === d.id}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}

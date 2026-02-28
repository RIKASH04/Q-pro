'use client'

import { motion } from 'framer-motion'
import { Users, Shield, Building2, Crown } from 'lucide-react'
import { OFFICE_TYPE_ICONS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface Props {
    roles: any[]
}

const roleStyles: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
    super_admin: { label: 'Super Admin', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: <Crown className="w-3 h-3" /> },
    office_admin: { label: 'Office Admin', badge: 'bg-brand-50 text-brand-700 border-brand-200', icon: <Shield className="w-3 h-3" /> },
    public: { label: 'Public User', badge: 'bg-slate-50 text-slate-500 border-slate-200', icon: <Users className="w-3 h-3" /> },
}

export default function AdminsClient({ roles }: Props) {
    const admins = roles.filter(r => r.role !== 'public')

    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="section-title">Admin Users</h1>
                <p className="section-subtitle">{admins.length} users with admin privileges</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-0 overflow-hidden"
            >
                {admins.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No admin users yet</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['User ID', 'Role', 'Assigned Office', 'Since'].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {admins.map((a, i) => {
                                const rs = roleStyles[a.role] ?? roleStyles.public
                                return (
                                    <motion.tr
                                        key={a.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 + i * 0.04 }}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <span className="text-xs font-mono text-slate-600 max-w-[120px] truncate">{a.user_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`badge ${rs.badge} gap-1`}>
                                                {rs.icon}
                                                {rs.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {a.offices ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">{OFFICE_TYPE_ICONS[a.offices.type] ?? '🏢'}</span>
                                                    <span className="text-sm text-slate-700">{a.offices.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">Platform-wide</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-500">{formatDate(a.created_at)}</td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </motion.div>
        </div>
    )
}

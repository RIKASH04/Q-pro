'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ReactNode
    color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'teal'
    subtitle?: string
    index?: number
}

const colorMap = {
    blue: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    teal: 'bg-teal-50 text-teal-600',
}

export default function StatCard({ title, value, icon, color = 'blue', subtitle, index = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            className="stat-card"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                    <motion.p
                        key={String(value)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-3xl font-bold text-slate-900 mt-1"
                    >
                        {value}
                    </motion.p>
                    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[color])}>
                    {icon}
                </div>
            </div>
        </motion.div>
    )
}

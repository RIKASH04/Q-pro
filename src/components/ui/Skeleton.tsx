import { motion } from 'framer-motion'

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`bg-slate-100 rounded-lg ${className}`}
        />
    )
}

export function StatSkeleton() {
    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            </div>
        </div>
    )
}

export function CardSkeleton() {
    return (
        <div className="card space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
        </div>
    )
}

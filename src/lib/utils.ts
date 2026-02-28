import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(' ')
}

export function formatTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function formatTokenNumber(num: number): string {
    return String(num).padStart(3, '0')
}

export function estimatedWaitTime(
    position: number,
    avgServiceTime: number
): number {
    return position * avgServiceTime
}

export function formatWaitTime(minutes: number): string {
    if (minutes < 1) return 'Less than a minute'
    if (minutes < 60) return `~${Math.round(minutes)} min`
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return m > 0 ? `~${h}h ${m}min` : `~${h}h`
}

export function estimatedServeTime(waitMinutes: number): string {
    const serveAt = new Date(Date.now() + waitMinutes * 60 * 1000)
    return formatTime(serveAt)
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AnalyticsClient from './AnalyticsClient'

export const metadata: Metadata = {
    title: 'Analytics — Q-Pro Super Admin',
}

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const today = new Date().toISOString().slice(0, 10)

    const [
        { count: totalOffices },
        { count: totalTokens },
        { count: todayTokens },
        { count: servedToday },
        { count: waitingNow },
    ] = await Promise.all([
        supabase.from('offices').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }),
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).gte('joined_at', `${today}T00:00:00`),
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('status', 'served').gte('joined_at', `${today}T00:00:00`),
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('status', 'waiting'),
    ])

    return (
        <AnalyticsClient
            stats={{
                totalOffices: totalOffices ?? 0,
                totalTokens: totalTokens ?? 0,
                todayTokens: todayTokens ?? 0,
                servedToday: servedToday ?? 0,
                waitingNow: waitingNow ?? 0,
            }}
        />
    )
}

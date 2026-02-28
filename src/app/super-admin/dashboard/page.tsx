import { createClient } from '@/lib/supabase/server'
import SuperAdminDashboardClient from './SuperAdminDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Super Admin Dashboard — Q-Pro',
}

export default async function SuperAdminDashboard() {
    const supabase = await createClient()

    const [
        { count: officeCount },
        { count: tokenCount },
        { count: adminCount },
        { data: recentOffices },
    ] = await Promise.all([
        supabase.from('offices').select('id', { count: 'exact', head: true }),
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'office_admin'),
        supabase.from('offices').select('*, user_roles(count)').order('created_at', { ascending: false }).limit(5),
    ])

    const today = new Date().toISOString().slice(0, 10)
    const { count: todayTokens } = await supabase
        .from('queue_tokens')
        .select('id', { count: 'exact', head: true })
        .gte('joined_at', `${today}T00:00:00`)

    return (
        <SuperAdminDashboardClient
            stats={{
                offices: officeCount ?? 0,
                totalTokens: tokenCount ?? 0,
                adminUsers: adminCount ?? 0,
                todayTokens: todayTokens ?? 0,
            }}
            recentOffices={recentOffices ?? []}
        />
    )
}

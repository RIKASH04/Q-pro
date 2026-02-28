import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OfficeDashboardClient from './OfficeDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Office Dashboard — Q-Pro',
}

export default async function OfficeDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('office_id, offices(*)')
        .eq('user_id', user.id)
        .single()

    if (!roleData?.office_id) redirect('/')

    const officeId = roleData.office_id
    const office = (roleData as any).offices

    const today = new Date().toISOString().slice(0, 10)

    const [
        { count: totalToday },
        { count: waiting },
        { count: served },
        { count: skipped },
        { data: queueState },
        { data: recentTokens },
    ] = await Promise.all([
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('office_id', officeId).gte('joined_at', `${today}T00:00:00`),
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('office_id', officeId).eq('status', 'waiting'),
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('office_id', officeId).eq('status', 'served').gte('joined_at', `${today}T00:00:00`),
        supabase.from('queue_tokens').select('id', { count: 'exact', head: true }).eq('office_id', officeId).eq('status', 'skipped').gte('joined_at', `${today}T00:00:00`),
        supabase.from('office_queue_state').select('*').eq('office_id', officeId).single(),
        supabase.from('queue_tokens').select('*').eq('office_id', officeId).order('joined_at', { ascending: false }).limit(5),
    ])

    return (
        <OfficeDashboardClient
            office={office}
            officeId={officeId}
            stats={{ totalToday: totalToday ?? 0, waiting: waiting ?? 0, served: served ?? 0, skipped: skipped ?? 0 }}
            queueState={queueState}
            recentTokens={recentTokens ?? []}
        />
    )
}

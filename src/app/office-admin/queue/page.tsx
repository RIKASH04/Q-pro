import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QueueClient from './QueueClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Queue Management — Q-Pro',
}

export default async function QueuePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('office_id')
        .eq('user_id', user.id)
        .single()

    if (!roleData?.office_id) redirect('/')

    const officeId = roleData.office_id

    const { data: tokens } = await supabase
        .from('queue_tokens')
        .select('*, departments(name)')
        .eq('office_id', officeId)
        .order('token_number', { ascending: true })
        .limit(100)

    return <QueueClient officeId={officeId} initialTokens={tokens ?? []} />
}

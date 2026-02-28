import { createClient } from '@/lib/supabase/server'
import AdminsClient from './AdminsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Admin Users — Q-Pro Super Admin',
}

export default async function AdminsPage() {
    const supabase = await createClient()

    // Note: Auth users data is restricted, but we can query user_roles joined with offices
    const { data: roles } = await supabase
        .from('user_roles')
        .select('*, offices(name, type)')
        .order('created_at', { ascending: false })

    return <AdminsClient roles={roles ?? []} />
}

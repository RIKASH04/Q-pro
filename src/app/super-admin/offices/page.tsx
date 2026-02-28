import { createClient } from '@/lib/supabase/server'
import OfficesManagementClient from './OfficesManagementClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Manage Offices — Q-Pro Super Admin',
}

export default async function OfficesPage() {
    const supabase = await createClient()
    const { data: offices } = await supabase
        .from('offices')
        .select('*')
        .order('created_at', { ascending: false })

    return <OfficesManagementClient offices={offices ?? []} />
}

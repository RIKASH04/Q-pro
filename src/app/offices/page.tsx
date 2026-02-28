import { createClient } from '@/lib/supabase/server'
import OfficesClient from './OfficesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Select an Office — Q-Pro',
    description: 'Choose a registered office to join the digital queue.',
}

export default async function OfficesPage() {
    const supabase = await createClient()
    const { data: offices } = await supabase
        .from('offices')
        .select('*')
        .eq('is_active', true)
        .order('name')

    return <OfficesClient offices={offices ?? []} />
}

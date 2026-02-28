import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JoinQueueClient from './JoinQueueClient'
import type { Metadata } from 'next'

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()
    const { data: office } = await supabase
        .from('offices')
        .select('name, description')
        .eq('slug', slug)
        .single()

    if (!office) return { title: 'Office Not Found — Q-Pro' }

    return {
        title: `${office.name} — Join Queue | Q-Pro`,
        description: office.description ?? `Join the digital queue at ${office.name} via Q-Pro.`,
    }
}

export default async function OfficePage({ params }: Props) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: office } = await supabase
        .from('offices')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!office) notFound()

    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .eq('office_id', office.id)
        .eq('is_active', true)
        .order('name')

    const { data: queueState } = await supabase
        .from('office_queue_state')
        .select('*')
        .eq('office_id', office.id)
        .single()

    return (
        <JoinQueueClient
            office={office}
            departments={departments ?? []}
            queueState={queueState}
        />
    )
}

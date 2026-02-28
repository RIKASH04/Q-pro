import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TokenStatusClient from './TokenStatusClient'
import type { Metadata } from 'next'

interface Props {
    params: Promise<{ slug: string; id: string }>
}

export const metadata: Metadata = {
    title: 'Token Status — Q-Pro',
}

export default async function TokenStatusPage({ params }: Props) {
    const { slug, id } = await params
    const supabase = await createClient()

    const { data: token } = await supabase
        .from('queue_tokens')
        .select('*, departments(*)')
        .eq('id', id)
        .single()

    if (!token) notFound()

    const { data: office } = await supabase
        .from('offices')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!office) notFound()

    return <TokenStatusClient token={token} office={office} />
}

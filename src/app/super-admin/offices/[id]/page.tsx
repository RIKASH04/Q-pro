import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OfficeDetailClient from './OfficeDetailClient'

interface Props {
    params: Promise<{ id: string }>
}

export default async function OfficeDetailPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const [{ data: office }, { data: departments }, { data: admins }] = await Promise.all([
        supabase.from('offices').select('*').eq('id', id).single(),
        supabase.from('departments').select('*').eq('office_id', id).order('name'),
        supabase.from('user_roles').select('*, auth_user:user_id(email)').eq('office_id', id).eq('role', 'office_admin'),
    ])

    if (!office) notFound()

    return <OfficeDetailClient office={office} departments={departments ?? []} admins={admins ?? []} />
}

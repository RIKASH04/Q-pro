import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DepartmentsClient from './DepartmentsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Departments — Q-Pro Office Admin',
}

export default async function DepartmentsPage() {
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

    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .eq('office_id', officeId)
        .order('name')

    return <DepartmentsClient officeId={officeId} office={office} departments={departments ?? []} />
}

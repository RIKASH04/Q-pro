import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OfficeAdminSidebar from '@/components/office-admin/OfficeAdminSidebar'

export default async function OfficeAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, office_id, offices(*)')
        .eq('user_id', user.id)
        .single()

    if (!roleData || roleData.role !== 'office_admin') redirect('/')

    const office = (roleData as any).offices

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <OfficeAdminSidebar office={office} />
            <main className="flex-1 overflow-y-auto scrollbar-thin">
                {children}
            </main>
        </div>
    )
}

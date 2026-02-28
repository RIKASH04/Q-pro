import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar'

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')
    if (user.email !== SUPER_ADMIN_EMAIL) redirect('/')

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <SuperAdminSidebar />
            <main className="flex-1 overflow-y-auto scrollbar-thin">
                {children}
            </main>
        </div>
    )
}

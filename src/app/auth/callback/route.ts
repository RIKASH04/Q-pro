import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SUPER_ADMIN_EMAIL, OFFICE_ADMIN_EMAILS } from '@/lib/constants'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/offices'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (user?.email) {
                // Ensure user role exists in DB (create on first login)
                const { data: existingRole } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .maybeSingle()

                let role: string
                if (!existingRole) {
                    role = 'public'
                    if (user.email === SUPER_ADMIN_EMAIL) role = 'super_admin'
                    else if (OFFICE_ADMIN_EMAILS.includes(user.email)) role = 'office_admin'

                    await supabase.from('user_roles').insert({
                        user_id: user.id,
                        role,
                    })
                } else {
                    role = existingRole.role
                }

                // Admin roles → redirect to their dashboards
                if (role === 'super_admin') {
                    return NextResponse.redirect(`${origin}/super-admin/dashboard`)
                }
                if (role === 'office_admin') {
                    return NextResponse.redirect(`${origin}/office-admin/dashboard`)
                }

                // Public/regular users: check for an active token first
                const { data: activeToken } = await supabase
                    .from('queue_tokens')
                    .select('id')
                    .eq('user_id', user.id)
                    .in('status', ['waiting', 'serving'])
                    .maybeSingle()

                if (activeToken) {
                    return NextResponse.redirect(`${origin}/my-queue`)
                }
            }

            // No active token — go to the requested `next` destination
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/user-login?error=auth_error`)
}

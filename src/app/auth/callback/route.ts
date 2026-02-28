import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SUPER_ADMIN_EMAIL, OFFICE_ADMIN_EMAILS } from '@/lib/constants'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (user?.email) {
                // Ensure user role exists in DB
                const { data: existingRole } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single()

                if (!existingRole) {
                    let role = 'public'
                    if (user.email === SUPER_ADMIN_EMAIL) role = 'super_admin'
                    else if (OFFICE_ADMIN_EMAILS.includes(user.email)) role = 'office_admin'

                    await supabase.from('user_roles').insert({
                        user_id: user.id,
                        role,
                    })
                }

                // Redirect based on role
                const role =
                    existingRole?.role ??
                    (user.email === SUPER_ADMIN_EMAIL
                        ? 'super_admin'
                        : OFFICE_ADMIN_EMAILS.includes(user.email)
                            ? 'office_admin'
                            : 'public')

                if (role === 'super_admin') {
                    return NextResponse.redirect(`${origin}/super-admin/dashboard`)
                } else if (role === 'office_admin') {
                    return NextResponse.redirect(`${origin}/office-admin/dashboard`)
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}

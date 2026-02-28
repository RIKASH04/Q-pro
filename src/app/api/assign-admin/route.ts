import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export async function POST(req: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, officeId } = await req.json()

    if (!email || !officeId) {
        return NextResponse.json({ error: 'Email and officeId are required' }, { status: 400 })
    }

    // Find user by email using service role
    // We use the admin API to get user by email
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: users } = await adminClient.auth.admin.listUsers()
    const targetUser = users?.users.find(u => u.email === email)

    if (!targetUser) {
        return NextResponse.json({ error: 'User not found. They must sign up first.' }, { status: 404 })
    }

    // Upsert role
    const { error } = await adminClient.from('user_roles').upsert({
        user_id: targetUser.id,
        role: 'office_admin',
        office_id: officeId,
    }, { onConflict: 'user_id' })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

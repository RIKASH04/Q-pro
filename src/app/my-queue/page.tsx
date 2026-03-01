import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyQueueClient from './MyQueueClient'

export default async function MyQueuePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login?next=/my-queue')
    }

    // Get active token for user
    const { data: token } = await supabase
        .from('queue_tokens')
        .select(`
            *,
            offices (*),
            departments (*)
        `)
        .eq('user_id', user.id)
        .in('status', ['waiting', 'serving'])
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                    <span className="text-3xl">🎫</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">No active token</h1>
                <p className="text-slate-500 text-center mb-6 max-w-xs">
                    You don&apos;t have any active tokens in the queue right now.
                </p>
                <a href="/offices" className="btn-primary py-2.5 px-6">
                    Join a Queue
                </a>
            </div>
        )
    }

    return <MyQueueClient initialToken={token as any} user={user} />
}

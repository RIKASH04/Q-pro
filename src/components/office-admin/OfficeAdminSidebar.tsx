'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Layers, LayoutDashboard, List, Settings,
    ChevronLeft, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { OFFICE_TYPE_ICONS } from '@/lib/constants'
import type { Office } from '@/lib/types'

interface Props {
    office: Office | null
}

export default function OfficeAdminSidebar({ office }: Props) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const navItems = [
        { href: '/office-admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
        { href: '/office-admin/queue', icon: <List className="w-4 h-4" />, label: 'Queue' },
        { href: '/office-admin/departments', icon: <Settings className="w-4 h-4" />, label: 'Departments' },
    ]

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    return (
        <aside className="w-60 bg-white border-r border-slate-100 flex flex-col h-full flex-shrink-0">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                        <Layers className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <span className="text-base font-bold text-slate-900">Q‑Pro</span>
                        <p className="text-[10px] text-slate-400 -mt-0.5 font-medium">Office Admin</p>
                    </div>
                </div>
            </div>

            {/* Office badge */}
            {office && (
                <div className="px-5 py-3.5 border-b border-slate-100 bg-brand-50/50">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">{OFFICE_TYPE_ICONS[office.type] ?? '🏢'}</span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{office.name}</p>
                            <p className="text-[10px] text-slate-500">Your Office</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5">
                {navItems.map(item => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={isActive ? 'nav-item-active' : 'nav-item'}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t border-slate-100 space-y-0.5">
                <Link href="/" className="nav-item">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Site
                </Link>
                <button onClick={handleLogout} className="nav-item w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}

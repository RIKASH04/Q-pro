'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Layers, LayoutDashboard, Building2, Users,
    BarChart3, LogOut, ChevronLeft
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
    { href: '/super-admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { href: '/super-admin/offices', icon: <Building2 className="w-4 h-4" />, label: 'Offices' },
    { href: '/super-admin/admins', icon: <Users className="w-4 h-4" />, label: 'Admin Users' },
    { href: '/super-admin/analytics', icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics' },
]

export default function SuperAdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

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
                        <p className="text-[10px] text-slate-400 -mt-0.5 font-medium">Super Admin</p>
                    </div>
                </div>
            </div>

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
                            {isActive && (
                                <motion.div
                                    layoutId="superAdminActiveTab"
                                    className="absolute inset-0 rounded-xl bg-brand-50 -z-10"
                                />
                            )}
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

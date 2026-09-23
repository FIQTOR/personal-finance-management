import { selectAuth } from '@/store/authSlice'
import { useAppSelector } from '@/store/hooks'
import { useState, useEffect, useCallback } from 'react'
import {
    TbHome, TbUsers, TbArrowLeft, TbChevronDown, TbShieldLock,
    TbKey, TbUserShield,
    TbWallet, TbMenu, TbX, TbSearch,
    TbLayoutDashboard, TbReceipt, TbChartPie, TbTarget
} from 'react-icons/tb'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PanelSearch from '@/components/PanelSearch'

interface SubItem {
    name: string
    href: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    permission: string
}

interface SidebarItem {
    name: string
    href?: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    permission?: string
    subItems?: SubItem[]
}

const commonStyles = {
    link: `group flex items-center rounded-xl px-4 py-3
           text-sm font-semibold tracking-tight
           transition-all duration-200 ease-out mb-1`,
    icon: `mr-3 shrink-0 transition-transform duration-200`,
    activeState: `bg-neutral-900/5 dark:bg-white/10 text-neutral-900 dark:text-white 
                  ring-1 ring-inset ring-neutral-900/10 dark:ring-white/20`,
    inactiveState: `text-neutral-500 dark:text-neutral-400 
                    hover:bg-neutral-900/5 dark:hover:bg-white/5 
                    hover:text-neutral-900 dark:hover:text-white`
}

const sidebarItems: SidebarItem[] = [
    { name: 'Dashboard', href: '/panel/dashboard', icon: TbHome, permission: 'view_dashboard' },
    {
        name: 'Personal Finance',
        icon: TbWallet,
        permission: 'view_dashboard',
        subItems: [
            { name: 'Overview', href: '/panel/finance/overview', icon: TbLayoutDashboard, permission: 'view_dashboard' },
            { name: 'Transactions', href: '/panel/finance/transactions', icon: TbReceipt, permission: 'view_dashboard' },
            { name: 'Budgets', href: '/panel/finance/budgets', icon: TbChartPie, permission: 'view_dashboard' },
            { name: 'Financial Goals', href: '/panel/finance/goals', icon: TbTarget, permission: 'view_dashboard' }
        ]
    },
    { name: 'Users', href: '/panel/users', icon: TbUsers, permission: 'manage_users' },
    {
        name: 'Access Control',
        icon: TbShieldLock,
        subItems: [
            { name: 'Roles', href: '/panel/roles', icon: TbUserShield, permission: 'manage_roles' },
            { name: 'Permissions', href: '/panel/roles/permissions', icon: TbKey, permission: 'manage_roles' }
        ]
    }
]

export default function Sidebar() {
    const { user } = useAppSelector(selectAuth)
    const permissions = new Set(user?.role?.permissions?.map((p) => p.name))
    const location = useLocation()
    const pathname = location.pathname
    const [openDropdown, setOpenDropdown] = useState<string | null>(() => {
        if (pathname.startsWith('/panel/finance')) return 'Personal Finance'
        if (pathname.startsWith('/panel/roles')) return 'Access Control'
        return null
    })
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
            if (window.innerWidth >= 1024) setIsMobileMenuOpen(false)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const openSearch = useCallback(() => setSearchOpen(true), [])

    // Global Ctrl/Cmd+K shortcut to open the panel search palette.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault()
                setSearchOpen((prev) => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const hasPermission = (permission?: string) => !permission || permissions.has(permission)

    const filteredSidebarItems = sidebarItems.filter(item => {
        if (item.subItems) {
            const accessibleSubItems = item.subItems.filter(subItem => hasPermission(subItem.permission))
            return accessibleSubItems.length > 0 ? { ...item, subItems: accessibleSubItems } : null
        }
        return hasPermission(item.permission)
    })

    const renderIcon = (Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>, isActive: boolean, size = 5) => (
        <Icon className={`${commonStyles.icon} h-${size} w-${size} 
            ${isActive ? 'scale-110 opacity-100' : 'opacity-70 group-hover:scale-110 group-hover:opacity-100'}`}
        />
    )

    const renderSubItems = (item: SidebarItem) => {
        const isOpen = openDropdown === item.name
        const isActive = item.subItems?.some(sub => pathname === sub.href || (sub.href === '/panel/finance/overview' && pathname === '/panel/finance'))

        return (
            <div key={item.name} className="px-2">
                <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.name)}
                    className={`w-full ${commonStyles.link} justify-between
                        ${isActive ? 'text-neutral-900 dark:text-white' : commonStyles.inactiveState}`}
                >
                    <div className="flex items-center">
                        {renderIcon(item.icon, isActive || false)}
                        <span>{item.name}</span>
                    </div>
                    <TbChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-6 space-y-1 mt-1 border-l ml-6 border-neutral-200 dark:border-neutral-700">
                        {item.subItems?.map(subItem => {
                            const isSubActive = pathname === subItem.href || (subItem.href === '/panel/finance/overview' && pathname === '/panel/finance')
                            return (
                                <Link
                                    key={subItem.name}
                                    to={subItem.href}
                                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                                    className={`${commonStyles.link} py-2 ${isSubActive ? commonStyles.activeState : commonStyles.inactiveState}`}
                                >
                                    {renderIcon(subItem.icon, isSubActive, 4)}
                                    <span className="text-sm">{subItem.name}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const renderSingleItem = (item: SidebarItem) => {
        const isActive = pathname === item.href
        return (
            <div key={item.name} className="px-2">
                <Link
                    to={item.href!}
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    className={`${commonStyles.link} ${isActive ? commonStyles.activeState : commonStyles.inactiveState}`}
                >
                    {renderIcon(item.icon, isActive)}
                    <span>{item.name}</span>
                </Link>
            </div>
        )
    }

    return (
        <>
            {isMobile && (
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="fixed top-4 left-4 z-50 p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 lg:hidden pointer-events-auto"
                >
                    {isMobileMenuOpen ? <TbX size={20} /> : <TbMenu size={20} />}
                </button>
            )}

            <aside className={`fixed top-0 left-0 h-screen w-64 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-xl border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col z-50 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-auto
                ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}>

                <div className="h-24 flex items-center px-6 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="mr-4 p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer relative z-10"
                        title="Go Back"
                    >
                        <TbArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs font-black tracking-[0.2em] text-neutral-400 uppercase">Control</span>
                        <h1 className="text-xl font-bold tracking-tighter text-neutral-900 dark:text-white">PANEL</h1>
                    </div>
                </div>

                <div className="px-4 mb-3">
                    <button
                        type="button"
                        onClick={openSearch}
                        className="group flex w-full items-center gap-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/70 bg-white/60 dark:bg-neutral-800/50 px-3 py-2.5 text-sm text-neutral-500 dark:text-neutral-400 backdrop-blur-sm transition-colors hover:bg-neutral-900/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                        title="Search pages (Ctrl/Cmd+K)"
                    >
                        <TbSearch className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">Search pages…</span>
                        <kbd className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-800/70 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
                            ⌘K
                        </kbd>
                    </button>
                </div>

                <nav className="flex-1 px-2 space-y-1 overflow-y-auto scrollbar-hide">
                    {filteredSidebarItems.map(item =>
                        item.subItems ? renderSubItems(item) : renderSingleItem(item)
                    )}
                </nav>

                <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between text-xs text-neutral-400">
                    <span>Finance System</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono font-bold">v1.X.X</span>
                </div>

            </aside>

            {isMobile && isMobileMenuOpen && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 transition-opacity duration-500 pointer-events-auto" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {searchOpen && (
                <PanelSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
            )}
        </>
    )
}

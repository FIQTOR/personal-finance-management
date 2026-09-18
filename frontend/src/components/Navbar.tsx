import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TbMenu2, TbX, TbWorld, TbMoon, TbSun, TbChevronDown, TbUser, TbSettings, TbLayoutDashboard, TbLogout, TbLogin, TbUserPlus } from 'react-icons/tb'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAuth, signOut } from '@/store/authSlice'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppConfig from '@/config/AppConfig'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage, LANGUAGES, type Language } from '@/context/LanguageContext'

interface NavLink {
    href: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    target?: string
    badge?: string
}

const Navbar = () => {
    const { user, accessToken }: any = useAppSelector(selectAuth)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const { theme, toggleTheme } = useTheme()
    const { language, setLanguage } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showLanguageMenu, setShowLanguageMenu] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathName = useLocation().pathname

    const permissions = user?.role?.permissions.map((permission: any) => permission.name)

    const navLinks: NavLink[] = [
        { href: '/', label: 'Home', icon: TbWorld },
    ]

    const linkStyles = {
        default: `px-4 py-2 rounded-lg text-sm flex items-center gap-2 text-neutral-900 dark:text-neutral-300 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/20`,
        mobile: "flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-neutral-300 hover:text-blue-600 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 border border-transparent",
        active: `text-blue-600 ${isScrolled || pathName !== '/'
            ? 'bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/50'
            : ''
            }`,
        signUp: "flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white dark:text-neutral-600 bg-neutral-800 dark:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
    }

    useEffect(() => {
        if (user && user.is_verified === false && !pathName.startsWith('/verify-email') && !pathName.startsWith('/email-verification')) {
            navigate('/email-verification')
        }
    }, [user, pathName, navigate])

    useEffect(() => {
        setMounted(true)

        const handleScroll = () => {
            const scrolled = window.scrollY > 10
            setIsScrolled(scrolled)
        }

        window.addEventListener('scroll', handleScroll)
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [pathName])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (showProfileMenu && !target.closest('.profile-menu')) {
                setShowProfileMenu(false)
            }
            if (showLanguageMenu && !target.closest('.language-menu')) {
                setShowLanguageMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showProfileMenu, showLanguageMenu])

    const handleLogout = () => {
        dispatch(signOut(accessToken)).then(() => {
            navigate("/signin");
        });
    };

    const renderAuthLinks = () => (
        <div className="profile-menu relative">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-600 transition-all duration-300 bg-white/20 dark:bg-white/10 backdrop-blur-sm"
            >
                <div className="relative">
                    <img
                        src={user.avatar_url?.startsWith('https://')
                            ? user.avatar_url
                            : user.avatar_url
                                ? `${AppConfig.baseApiUrl?.replace('/api', '')}/${user.avatar_url}`
                                : "/img/default-profile.png"
                        }
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/img/default-profile.png";
                        }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <TbChevronDown className={`w-4 h-4 text-gray-600 dark:text-neutral-300 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </motion.button>

            {showProfileMenu && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-3 w-56 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-neutral-700/50 py-2 z-50"
                >
                    <div className="px-4 py-3 border-b border-gray-200/50 dark:border-neutral-700/50">
                        <div className="flex items-center gap-3">
                            <img
                                src={user.avatar_url?.startsWith('https://')
                                    ? user.avatar_url
                                    : user.avatar_url
                                        ? `${AppConfig.baseApiUrl?.replace('/api', '')}/${user.avatar_url}`
                                        : "/img/default-profile.png"
                                }
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/img/default-profile.png";
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="py-2">
                        <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                        >
                            <TbUser className="w-4 h-4" />
                            Profile
                        </Link>
                        <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                        >
                            <TbSettings className="w-4 h-4" />
                            Settings
                        </Link>
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                        >
                            <TbLayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        {permissions?.includes('view_dashboard') && !pathName.startsWith('/panel/') && (
                            <Link
                                to="/panel/dashboard"
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                onClick={() => setShowProfileMenu(false)}
                            >
                                <TbLayoutDashboard className="w-4 h-4 text-indigo-600" />
                                Admin Dashboard
                            </Link>
                        )}
                    </div>

                    <div className="border-t border-gray-200/50 dark:border-neutral-700/50 pt-2">
                        <button
                            onClick={() => {
                                handleLogout()
                                setShowProfileMenu(false)
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <TbLogout className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )

    const renderGuestLinks = () => (
        <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                    to="/signin"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-blue-600 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 border border-transparent hover:border-white/20 ${isScrolled || pathName !== '/' ? '' : 'text-white dark:text-white'}`}
                >
                    <TbLogin className="w-4 h-4" />
                    Login
                </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                    to="/signup"
                    className={linkStyles.signUp}
                >
                    <TbUserPlus className="w-4 h-4" />
                    Sign Up
                </Link>
            </motion.div>
        </div>
    )

    return (
        <>
            <header className={`fixed w-full z-50 pointer-events-none transition-all duration-500 ${isScrolled || pathName !== '/' ? 'top-4' : 'top-0'}`}>
                <div className={`flex px-4 ${pathName.includes('/panel') ? 'justify-end' : 'justify-center'}`}>
                    <nav className={`pointer-events-auto w-full lg:w-fit transition-all duration-500 border rounded-full
                        ${isScrolled || pathName !== '/'
                            ? 'bg-white/60 dark:bg-neutral-900/60 shadow-lg backdrop-blur-md px-6 border-white/20 dark:border-white/10'
                            : 'bg-transparent border-transparent px-2'
                        }`}>
                        <div className="flex items-center justify-between h-14 md:h-16">
                            <motion.div whileHover={{ scale: 1.05 }} className="shrink-0 mr-7 relative">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.4, 0.85, 0.4],
                                    }}
                                    transition={{
                                        duration: 4.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-500/50 via-teal-400/40 to-blue-500/50 blur-lg pointer-events-none"
                                />
                                <Link to="/" className="relative z-10 flex items-center gap-3">
                                    <img src="/img/icon.webp" alt="icon" className='w-8 h-8 md:w-10 md:h-10 rounded-full shadow-md border border-white/20 dark:border-neutral-700/50' />
                                </Link>
                            </motion.div>

                            <div className="hidden lg:block">
                                <div className="flex items-center gap-1 px-1">
                                    {navLinks.map((link) => {
                                        const isActive = pathName === link.href
                                        return (
                                            <Link
                                                key={link.href}
                                                to={link.href}
                                                target={link.target || '_self'}
                                                className={`${linkStyles.default} ${isActive ? linkStyles.active : ''} ${!isScrolled && pathName === '/' ? 'hover:text-blue-500' : 'text-gray-700'}`}
                                            >
                                                {link.label}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className='flex items-center gap-2 md:gap-3'>
                                {mounted ? (user ? renderAuthLinks() : renderGuestLinks()) : null}

                                {mounted && (
                                    <>
                                        <div className="language-menu relative">
                                            <button
                                                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                                className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-xs font-bold uppercase text-neutral-800 dark:text-neutral-200 flex items-center gap-1"
                                                title="Change Language"
                                            >
                                                <TbWorld className="w-4 h-4 text-emerald-500" />
                                                {language.toUpperCase()}
                                                <TbChevronDown className={`w-3 h-3 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showLanguageMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    className="absolute right-0 mt-2 w-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-neutral-700/50 py-1 z-50"
                                                >
                                                    {LANGUAGES.map((lang) => (
                                                        <button
                                                            key={lang.code}
                                                            onClick={() => {
                                                                setLanguage(lang.code as Language)
                                                                setShowLanguageMenu(false)
                                                            }}
                                                            className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold transition-colors ${language === lang.code
                                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                                                                : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                                                                }`}
                                                        >
                                                            <span>{lang.name}</span>
                                                            <span className="font-mono text-[10px] opacity-60 uppercase">{lang.code}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => toggleTheme(e)}
                                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                        >
                                            {theme === 'dark' ? <TbMoon className="w-5 h-5 text-blue-400" /> : <TbSun className="w-5 h-5 text-yellow-500" />}
                                        </button>
                                    </>
                                )}

                                <div className="lg:hidden">
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/20"
                                    >
                                        {isOpen ? <TbX className="w-5 h-5" /> : <TbMenu2 className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
            </header>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-auto"
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
                        }}
                        exit={{
                            opacity: 0,
                            y: "100%",
                            transition: { duration: 0.3, ease: "easeInOut" }
                        }}
                    >
                        <div className="px-4 py-4 space-y-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-white/20 dark:border-neutral-700/20 shadow-2xl rounded-t-3xl">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-12 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full"></div>
                            </div>

                            {navLinks.map((link, index) => {
                                const IconComponent = link.icon
                                const isActive = pathName === link.href
                                return (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            transition: { duration: 0.3, delay: 0.1 + (index * 0.05), ease: "easeOut" }
                                        }}
                                        whileHover={{ x: 5, transition: { duration: 0.2 } }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Link
                                            to={link.href}
                                            className={`${linkStyles.mobile} ${isActive ? linkStyles.active : ''}`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {IconComponent && <IconComponent className="w-5 h-5" />}
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Navbar

import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface PanelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    loading?: boolean
    loadingText?: string
    icon?: ReactNode
    fullWidth?: boolean
}

const PanelButton = ({
    variant = 'primary', loading = false, loadingText, icon,
    fullWidth = false, children, className = '', disabled, ...props
}: PanelButtonProps) => {
    const base = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
    const variants = {
        primary: 'bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500',
        secondary: 'text-gray-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/30 dark:border-neutral-600/30 hover:bg-white/60 dark:hover:bg-neutral-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/30',
        danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60 hover:bg-red-500/20',
        ghost: 'text-gray-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-neutral-800/70',
    }
    return (
        <button {...props} disabled={disabled || loading}
            className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
            {loading ? <span className="loader" style={{ width: 18, height: 18 }}></span> : icon}
            {loading && loadingText ? loadingText : children}
        </button>
    )
}
export default PanelButton

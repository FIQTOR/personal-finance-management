interface PanelCheckboxProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label: string
    disabled?: boolean
    activeColor?: 'blue' | 'green' | 'red'
    className?: string
}

const PanelCheckbox = ({ checked, onChange, label, disabled = false, activeColor = 'blue', className = '' }: PanelCheckboxProps) => {
    const colorClass = {
        blue: 'peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600',
        green: 'peer-checked:bg-green-600 dark:peer-checked:bg-green-600',
        red: 'peer-checked:bg-red-600 dark:peer-checked:bg-red-600',
    }[activeColor]
    return (
        <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            <span className="relative inline-flex items-center">
                <input type="checkbox" checked={checked} disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
                <span className={`w-11 h-6 rounded-full bg-gray-200 dark:bg-neutral-700 transition-all duration-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 ${colorClass}`}></span>
            </span>
            {label && <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">{label}</span>}
        </label>
    )
}
export default PanelCheckbox

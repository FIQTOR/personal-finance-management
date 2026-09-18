import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TbChevronDown, TbCheck } from 'react-icons/tb';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 text-xs sm:text-sm font-medium transition-all shadow-2xs hover:border-emerald-500/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : <span className="text-gray-400 dark:text-neutral-500">{placeholder}</span>}
          </span>
        </div>
        <TbChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 py-1 scrollbar-thin"
          >
            {options.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-gray-400 dark:text-neutral-500 text-center">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm transition-colors text-left ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {option.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </div>
                    {isSelected && <TbCheck className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, SVGProps, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TbSearch, TbCornerDownLeft } from 'react-icons/tb';
import { splitHighlight } from '@/utils/search';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface SearchItem {
    id: string;
    label: string;
    hint?: string;
    icon?: IconComponent;
    onSelect: () => void;
}

export interface SearchSection {
    title: string;
    items: SearchItem[];
}

interface SearchModalProps {
    open: boolean;
    onClose: () => void;
    query: string;
    onQueryChange: (value: string) => void;
    sections: SearchSection[];
    placeholder?: string;
    loading?: boolean;
}

/** Flatten the (already filtered) sections into navigation order. */
const flatten = (sections: SearchSection[]): SearchItem[] =>
    sections.flatMap((section) => section.items);

/**
 * Reusable accessible command-palette shell. It owns keyboard navigation and
 * rendering; the query + filtered sections are controlled by the caller so the
 * same component powers the panel search and any future palette.
 */
export default function SearchModal({
    open,
    onClose,
    query,
    onQueryChange,
    sections,
    placeholder = 'Search…',
    loading = false,
}: SearchModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [prevQuery, setPrevQuery] = useState(query);

    const flatItems = useMemo(() => flatten(sections), [sections]);
    const isEmpty = flatItems.length === 0;

    // Reset the cursor to the first row whenever the query changes. Adjusting
    // state during render (React's recommended pattern) avoids a cascading
    // re-render from an effect.
    if (prevQuery !== query) {
        setPrevQuery(query);
        setActiveIndex(0);
    }

    // Autofocus the input whenever the palette opens.
    useEffect(() => {
        if (open) {
            const id = window.setTimeout(() => inputRef.current?.focus(), 20);
            return () => window.clearTimeout(id);
        }
    }, [open]);

    // Scroll the active item into view.
    useEffect(() => {
        const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    if (!open) return null;

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (flatItems.length === 0) return;
            setActiveIndex((prev) => (prev + 1) % flatItems.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (flatItems.length === 0) return;
            setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const item = flatItems[activeIndex];
            if (item) {
                item.onSelect();
                onClose();
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        }
    };

    const renderHighlighted = (text: string) => {
        const segments = splitHighlight(text, query);
        return segments.map((segment, index) =>
            segment.match ? (
                <mark
                    key={index}
                    className="bg-transparent text-blue-600 dark:text-blue-400 font-semibold"
                >
                    {segment.text}
                </mark>
            ) : (
                <span key={index}>{segment.text}</span>
            )
        );
    };

    let runningIndex = -1;

    return (
        <AnimatePresence>
            <motion.div
                key="panel-search-overlay"
                className="fixed inset-0 z-200 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[12vh]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={onClose}
                role="presentation"
            >
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Search pages"
                    className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/20 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl"
                    initial={{ opacity: 0, scale: 0.97, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={handleKeyDown}
                >
                    {/* Search input */}
                    <div className="flex items-center gap-3 border-b border-neutral-200/70 dark:border-neutral-800 px-4 py-3.5">
                        <TbSearch className="h-5 w-5 shrink-0 text-neutral-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(event) => onQueryChange(event.target.value)}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none"
                            aria-label={placeholder}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <kbd className="hidden sm:inline-flex items-center rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-800/70 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-[60vh] overflow-y-auto px-2 py-2">
                        {loading ? (
                            <p className="px-3 py-8 text-center text-sm text-neutral-400">
                                Loading…
                            </p>
                        ) : isEmpty ? (
                            <p className="px-3 py-8 text-center text-sm text-neutral-400">
                                No results found.
                            </p>
                        ) : (
                            sections.map((section) => {
                                if (section.items.length === 0) return null;
                                return (
                                    <div key={section.title} className="mb-1">
                                        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                                            {section.title}
                                        </p>
                                        {section.items.map((item) => {
                                            runningIndex += 1;
                                            const index = runningIndex;
                                            const isActive = index === activeIndex;
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    data-active={isActive}
                                                    onMouseEnter={() => setActiveIndex(index)}
                                                    onClick={() => {
                                                        item.onSelect();
                                                        onClose();
                                                    }}
                                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                                        isActive
                                                            ? 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                                                            : 'text-gray-700 dark:text-neutral-300 hover:bg-neutral-900/5 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    {Icon && (
                                                        <Icon className="h-4.5 w-4.5 shrink-0 opacity-80" />
                                                    )}
                                                    <span className="flex-1 truncate">
                                                        {renderHighlighted(item.label)}
                                                    </span>
                                                    {item.hint && (
                                                        <span className="shrink-0 truncate text-xs text-neutral-400">
                                                            {item.hint}
                                                        </span>
                                                    )}
                                                    {isActive && (
                                                        <TbCornerDownLeft className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer hints */}
                    <div className="flex items-center justify-between gap-4 border-t border-neutral-200/70 dark:border-neutral-800 px-4 py-2.5 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1.5">
                            <kbd className="rounded border border-neutral-200 dark:border-neutral-700 px-1 font-mono">↑</kbd>
                            <kbd className="rounded border border-neutral-200 dark:border-neutral-700 px-1 font-mono">↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="rounded border border-neutral-200 dark:border-neutral-700 px-1 font-mono">↵</kbd>
                            to open
                            <kbd className="ml-1 rounded border border-neutral-200 dark:border-neutral-700 px-1 font-mono">ESC</kbd>
                            to close
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

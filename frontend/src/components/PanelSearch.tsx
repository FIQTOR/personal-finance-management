import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbLayoutDashboard, TbPlus } from 'react-icons/tb';
import { selectAuth } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import SearchModal from '@/components/SearchModal';
import type { SearchSection } from '@/components/SearchModal';
import { PANEL_PAGES, canAccessPanelPage } from '@/config/panelPages';
import type { PanelPage } from '@/config/panelPages';
import { scoreMatch } from '@/utils/search';

interface PanelSearchProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Command palette over every panel page. Pages are permission-filtered, matched
 * against the query and grouped by category for display.
 */
export default function PanelSearch({ open, onClose }: PanelSearchProps) {
    const navigate = useNavigate();
    const { user } = useAppSelector(selectAuth);
    const [query, setQuery] = useState('');

    const permissions = useMemo(
        () => new Set(user?.role?.permissions?.map((p) => p.name)),
        [user]
    );

    const sections: SearchSection[] = useMemo(() => {
        const accessible = PANEL_PAGES.filter((page) => canAccessPanelPage(page, permissions));

        const scored = accessible
            .map((page) => ({ page, score: scoreMatch(page, query) }))
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score);

        const byCategory = new Map<string, PanelPage[]>();
        for (const { page } of scored) {
            const list = byCategory.get(page.category) ?? [];
            list.push(page);
            byCategory.set(page.category, list);
        }

        return Array.from(byCategory.entries()).map(([title, pages]) => ({
            title,
            items: pages.map((page) => ({
                id: page.href,
                label: page.label,
                hint: page.href,
                icon: page.kind === 'action' ? TbPlus : TbLayoutDashboard,
                onSelect: () => navigate(page.href),
            })),
        }));
    }, [permissions, query, navigate]);

    const handleClose = () => {
        setQuery('');
        onClose();
    };

    return (
        <SearchModal
            open={open}
            onClose={handleClose}
            query={query}
            onQueryChange={setQuery}
            sections={sections}
            placeholder="Search pages…"
        />
    );
}

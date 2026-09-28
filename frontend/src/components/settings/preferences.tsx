import { useEffect, useState } from 'react';
import { TbPalette, TbLanguage, TbCheck, TbSun, TbMoon } from 'react-icons/tb';
import { useTheme } from '@/context/useTheme';
import { useLanguage } from '@/context/useLanguage';
import type { Language } from '@/context/LanguageContext';
import { savePreferences } from '@/services/preferencesService';
import { getErrorMessage } from '@/utils/error';

type Theme = 'light' | 'dark';

interface FeedbackResponse {
    status: 'success' | 'error';
    message: string;
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof TbSun }[] = [
    { value: 'light', label: 'Light', icon: TbSun },
    { value: 'dark', label: 'Dark', icon: TbMoon },
];

const LANGUAGE_OPTIONS: { value: Language; label: string; native: string }[] = [
    { value: 'en', label: 'English', native: 'English' },
    { value: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
    { value: 'zh', label: 'Chinese', native: '中文' },
    { value: 'ar', label: 'Arabic', native: 'العربية' },
    { value: 'hi', label: 'Hindi', native: 'हिन्दी' },
];

const PreferencesMenu = () => {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();

    const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
    const [response, setResponse] = useState<FeedbackResponse | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Keep the local selection in sync if the context changes elsewhere.
    useEffect(() => {
        setSelectedTheme(theme);
    }, [theme]);

    useEffect(() => {
        setSelectedLanguage(language);
    }, [language]);

    const handleSave = async () => {
        setIsSaving(true);
        setResponse(null);

        // Apply immediately via the contexts (also mirrors to localStorage).
        setTheme(selectedTheme);
        if (selectedLanguage !== language) {
            setLanguage(selectedLanguage);
        }

        try {
            await savePreferences({ theme: selectedTheme, language: selectedLanguage });
            setResponse({ status: 'success', message: 'Preferences saved to your account!' });
        } catch (error) {
            setResponse({
                status: 'error',
                message: getErrorMessage(error, 'Failed to save preferences. Please try again.'),
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {response && (
                <div className={`p-4 rounded-2xl ${
                    response.status === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                }`}>
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                        <TbCheck className="w-5 h-5 shrink-0" />
                        <span>{response.message}</span>
                    </div>
                </div>
            )}

            {/* Theme Card */}
            <div className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800/80 space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TbPalette className="w-4 h-4 text-emerald-500" /> Appearance
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Choose how the interface looks. This preference is saved to your account and follows you across devices.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {THEME_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isActive = selectedTheme === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setSelectedTheme(option.value)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all text-left ${
                                    isActive
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : 'bg-white dark:bg-neutral-800/60 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-emerald-500/40'
                                }`}
                            >
                                <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span>{option.label}</span>
                                {isActive && <TbCheck className="w-4 h-4 ml-auto text-emerald-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Language Card */}
            <div className="bg-gray-50/60 dark:bg-neutral-800/40 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800/80 space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TbLanguage className="w-4 h-4 text-emerald-500" /> Language
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Select your preferred display language. This preference is saved to your account.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {LANGUAGE_OPTIONS.map((option) => {
                        const isActive = selectedLanguage === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setSelectedLanguage(option.value)}
                                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all text-left ${
                                    isActive
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : 'bg-white dark:bg-neutral-800/60 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-emerald-500/40'
                                }`}
                            >
                                <span className="flex-1">
                                    <span className="block text-gray-900 dark:text-white">{option.native}</span>
                                    <span className="block text-[11px] font-medium text-gray-500 dark:text-neutral-400">{option.label}</span>
                                </span>
                                {isActive && <TbCheck className="w-4 h-4 text-emerald-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Preferences apply instantly and sync to your account.
                </p>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-2xs ${
                        isSaving
                            ? 'bg-gray-300 dark:bg-neutral-700 text-gray-500 dark:text-neutral-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    }`}
                >
                    <TbCheck className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
};

export default PreferencesMenu;

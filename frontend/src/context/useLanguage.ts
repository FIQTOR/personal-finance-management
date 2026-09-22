import { useContext } from 'react';
import { LanguageContext, type LanguageContextType } from './LanguageContext';

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

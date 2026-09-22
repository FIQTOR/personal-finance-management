import type { Language } from '@/context/LanguageContext';

export const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'id', label: 'ID', name: 'Bahasa Indonesia' },
  { code: 'zh', label: 'ZH', name: '中文' },
  { code: 'ar', label: 'AR', name: 'العربية' },
  { code: 'hi', label: 'HI', name: 'हिन्दी' },
];

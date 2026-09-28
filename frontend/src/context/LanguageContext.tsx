import React, { createContext, useMemo, useState } from 'react';
import { savePreferences } from '@/services/preferencesService';
import { debounce } from '@/utils/debounce';

export type Language = 'en' | 'id' | 'zh' | 'ar' | 'hi';


const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    finance: 'Personal Finance',
    overview: 'Overview',
    transactions: 'Transactions',
    budgets: 'Budgets',
    goals: 'Financial Goals',
    recurring: 'Recurring',
    netBalance: 'Total Net Balance',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    budgetUsage: 'Budget Usage',
    newTransaction: 'New Transaction',
    exportExcel: 'Export to Excel',
    settings: 'Settings',
    profile: 'Profile',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    setupTitle: 'App Setup',
    welcomeBack: 'Welcome back',
    category: 'Category',
    type: 'Type',
    amount: 'Amount',
    currency: 'Currency',
    date: 'Date',
    notes: 'Notes',
    actions: 'Actions',
    income: 'Income',
    expense: 'Expense',
    save: 'Save',
    cancel: 'Cancel',
    selectCategory: 'Select Category',
    period: 'Period',
    budgetVsActual: 'Budget vs Actual',
    budgeted: 'Budgeted',
    spent: 'Spent',
    budgetUtilisation: 'Budget Utilisation',
    onTrack: 'On track',
    behind: 'Behind',
    ahead: 'Ahead',
    projectedCompletion: 'Projected completion',
    requiredMonthly: 'Required monthly',
    achieved: 'Achieved',
    imported: 'imported',
    failed: 'failed',
    rowsImported: 'rows imported',
    valid: 'valid',
    invalid: 'invalid',
    rowsDetected: 'rows detected',
    downloadFailedRows: 'Download failed rows',
    parsing: 'Parsing',
    preview: 'Preview',
    importing: 'Importing',
    done: 'Done',
    exportAs: 'Export as',
    exporting: 'Exporting'
  },
  id: {
    dashboard: 'Dasbor',
    finance: 'Keuangan Pribadi',
    overview: 'Ikhtisar',
    transactions: 'Transaksi',
    budgets: 'Anggaran',
    goals: 'Target Tabungan',
    recurring: 'Berulang',
    netBalance: 'Total Saldo Bersih',
    totalIncome: 'Total Pemasukan',
    totalExpenses: 'Total Pengeluaran',
    budgetUsage: 'Penggunaan Anggaran',
    newTransaction: 'Transaksi Baru',
    exportExcel: 'Ekspor ke Excel',
    settings: 'Pengaturan',
    profile: 'Profil',
    signOut: 'Keluar',
    signIn: 'Masuk',
    setupTitle: 'Penyiapan Aplikasi',
    welcomeBack: 'Selamat datang kembali',
    category: 'Kategori',
    type: 'Tipe',
    amount: 'Jumlah',
    currency: 'Mata Uang',
    date: 'Tanggal',
    notes: 'Catatan',
    actions: 'Aksi',
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    save: 'Simpan',
    cancel: 'Batal',
    selectCategory: 'Pilih Kategori',
    period: 'Periode',
    budgetVsActual: 'Anggaran vs Aktual',
    budgeted: 'Dianggarkan',
    spent: 'Terpakai',
    budgetUtilisation: 'Penggunaan Anggaran',
    onTrack: 'Sesuai jalur',
    behind: 'Tertinggal',
    ahead: 'Lebih cepat',
    projectedCompletion: 'Perkiraan selesai',
    requiredMonthly: 'Tabungan bulanan diperlukan',
    achieved: 'Tercapai',
    imported: 'berhasil diimpor',
    failed: 'gagal',
    rowsImported: 'baris diimpor',
    valid: 'valid',
    invalid: 'tidak valid',
    rowsDetected: 'baris terdeteksi',
    downloadFailedRows: 'Unduh baris gagal',
    parsing: 'Mengurai',
    preview: 'Pratinjau',
    importing: 'Mengimpor',
    done: 'Selesai',
    exportAs: 'Ekspor sebagai',
    exporting: 'Mengekspor'
  },
  zh: {
    dashboard: '仪表板',
    finance: '个人财务',
    overview: '概览',
    transactions: '交易明细',
    budgets: '预算管理',
    goals: '财务目标',
    recurring: '定期交易',
    netBalance: '净资产总额',
    totalIncome: '总收入',
    totalExpenses: '总支出',
    budgetUsage: '预算使用率',
    newTransaction: '新建交易',
    exportExcel: '导出为 Excel',
    settings: '设置',
    profile: '个人资料',
    signOut: '退出登录',
    signIn: '登录',
    setupTitle: '应用设置',
    welcomeBack: '欢迎回来',
    category: '类别',
    type: '类型',
    amount: '金额',
    currency: '货币',
    date: '日期',
    notes: '备注',
    actions: '操作',
    income: '收入',
    expense: '支出',
    save: '保存',
    cancel: '取消',
    selectCategory: '选择类别',
    period: '周期',
    budgetVsActual: '预算与实际',
    budgeted: '预算',
    spent: '已支出',
    budgetUtilisation: '预算使用率',
    onTrack: '进展顺利',
    behind: '落后',
    ahead: '领先',
    projectedCompletion: '预计完成日期',
    requiredMonthly: '每月所需存款',
    achieved: '已达成',
    imported: '已导入',
    failed: '失败',
    rowsImported: '行已导入',
    valid: '有效',
    invalid: '无效',
    rowsDetected: '行已检测',
    downloadFailedRows: '下载失败行',
    parsing: '解析中',
    preview: '预览',
    importing: '导入中',
    done: '完成',
    exportAs: '导出为',
    exporting: '导出中'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    finance: 'المالية الشخصية',
    overview: 'نظرة عامة',
    transactions: 'المعاملات',
    budgets: 'الميزانيات',
    goals: 'الأهداف المالية',
    recurring: 'المتكررة',
    netBalance: 'إجمالي الرصيد الصافي',
    totalIncome: 'إجمالي الدخل',
    totalExpenses: 'إجمالي المصروفات',
    budgetUsage: 'استخدام الميزانية',
    newTransaction: 'معاملة جديدة',
    exportExcel: 'تصدير إلى Excel',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    signOut: 'تسجيل الخروج',
    signIn: 'تسجيل الدخول',
    setupTitle: 'إعداد التطبيق',
    welcomeBack: 'مرحباً بعودتك',
    category: 'الفئة',
    type: 'النوع',
    amount: 'المبلغ',
    currency: 'العملة',
    date: 'التاريخ',
    notes: 'الملاحظات',
    actions: 'الإجراءات',
    income: 'دخل',
    expense: 'مصروف',
    save: 'حفظ',
    cancel: 'إلغاء',
    selectCategory: 'حدد الفئة',
    period: 'الفترة',
    budgetVsActual: 'الميزانية مقابل الفعلي',
    budgeted: 'المخطط',
    spent: 'المنفق',
    budgetUtilisation: 'استخدام الميزانية',
    onTrack: 'على المسار',
    behind: 'متأخر',
    ahead: 'متقدم',
    projectedCompletion: 'الإنجاز المتوقع',
    requiredMonthly: 'الادخار الشهري المطلوب',
    achieved: 'تم التحقيق',
    imported: 'تم استيراد',
    failed: 'فشل',
    rowsImported: 'صفوف مستوردة',
    valid: 'صالح',
    invalid: 'غير صالح',
    rowsDetected: 'صفوف تم اكتشافها',
    downloadFailedRows: 'تنزيل الصفوف الفاشلة',
    parsing: 'جارٍ التحليل',
    preview: 'معاينة',
    importing: 'جارٍ الاستيراد',
    done: 'تم',
    exportAs: 'تصدير كـ',
    exporting: 'جارٍ التصدير'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    finance: 'व्यक्तिगत वित्त',
    overview: 'अवलोकन',
    transactions: 'लेन-देन',
    budgets: 'बजट',
    goals: 'वित्तीय लक्ष्य',
    recurring: 'आवर्ती',
    netBalance: 'कुल शुद्ध शेष',
    totalIncome: 'कुल आय',
    totalExpenses: 'कुल व्यय',
    budgetUsage: 'बजट उपयोग',
    newTransaction: 'नया लेन-देन',
    exportExcel: 'एक्सेल निर्यात करें',
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    signOut: 'साइन आउट',
    signIn: 'साइन इन',
    setupTitle: 'ऐप सेटअप',
    welcomeBack: 'वापसी पर स्वागत है',
    category: 'श्रेणी',
    type: 'प्रकार',
    amount: 'राशि',
    currency: 'मुद्रा',
    date: 'तिथि',
    notes: 'टिप्पणियां',
    actions: 'कार्रवाइयां',
    income: 'आय',
    expense: 'व्यय',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    selectCategory: 'श्रेणी चुनें',
    period: 'अवधि',
    budgetVsActual: 'बजट बनाम वास्तविक',
    budgeted: 'बजट किया गया',
    spent: 'खर्च किया गया',
    budgetUtilisation: 'बजट उपयोग',
    onTrack: 'सही दिशा में',
    behind: 'पीछे',
    ahead: 'आगे',
    projectedCompletion: 'अनुमानित पूर्णता',
    requiredMonthly: 'आवश्यक मासिक बचत',
    achieved: 'प्राप्त',
    imported: 'आयातित',
    failed: 'विफल',
    rowsImported: 'पंक्तियाँ आयातित',
    valid: 'मान्य',
    invalid: 'अमान्य',
    rowsDetected: 'पंक्तियाँ मिलीं',
    downloadFailedRows: 'विफल पंक्तियाँ डाउनलोड करें',
    parsing: 'पार्सिंग',
    preview: 'पूर्वावलोकन',
    importing: 'आयात हो रहा है',
    done: 'पूर्ण',
    exportAs: 'इस रूप में निर्यात करें',
    exporting: 'निर्यात हो रहा है'
  }
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /**
   * Apply a language coming from the authenticated account (login/refresh).
   * When `persist` is true, subsequent user changes are synced to the server.
   */
  setLanguageFromAccount: (lang: Language, persist: boolean) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export { LanguageContext };

const STORAGE_KEY = 'app_language';
const SUPPORTED_LANGUAGES: Language[] = ['en', 'id', 'zh', 'ar', 'hi'];
const PERSIST_DEBOUNCE_MS = 600;

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : 'en';
  });

  // Whether account persistence is active (enabled once an authenticated user
  // with preferences is available).
  const [persistEnabled, setPersistEnabled] = useState(false);

  // Debounced, fire-and-forget persistence to the account (errors ignored).
  const persistLanguage = useMemo(
    () => debounce((next: Language) => {
      if (!persistEnabled) return;
      void savePreferences({ language: next }).catch(() => undefined);
    }, PERSIST_DEBOUNCE_MS),
    [persistEnabled]
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    persistLanguage(lang);
  };

  const setLanguageFromAccount = (lang: Language, persist: boolean) => {
    setPersistEnabled(persist);
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, setLanguageFromAccount, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

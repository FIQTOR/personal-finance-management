import React, { createContext, useState } from 'react';

export type Language = 'en' | 'id' | 'zh' | 'ar' | 'hi';


const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    finance: 'Personal Finance',
    overview: 'Overview',
    transactions: 'Transactions',
    budgets: 'Budgets',
    goals: 'Financial Goals',
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
    selectCategory: 'Select Category'
  },
  id: {
    dashboard: 'Dasbor',
    finance: 'Keuangan Pribadi',
    overview: 'Ikhtisar',
    transactions: 'Transaksi',
    budgets: 'Anggaran',
    goals: 'Target Tabungan',
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
    selectCategory: 'Pilih Kategori'
  },
  zh: {
    dashboard: '仪表板',
    finance: '个人财务',
    overview: '概览',
    transactions: '交易明细',
    budgets: '预算管理',
    goals: '财务目标',
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
    selectCategory: '选择类别'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    finance: 'المالية الشخصية',
    overview: 'نظرة عامة',
    transactions: 'المعاملات',
    budgets: 'الميزانيات',
    goals: 'الأهداف المالية',
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
    selectCategory: 'حدد الفئة'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    finance: 'व्यक्तिगत वित्त',
    overview: 'अवलोकन',
    transactions: 'लेन-देन',
    budgets: 'बजट',
    goals: 'वित्तीय लक्ष्य',
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
    selectCategory: 'श्रेणी चुनें'
  }
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export { LanguageContext };

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language') as Language;
    return ['en', 'id', 'zh', 'ar', 'hi'].includes(saved) ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

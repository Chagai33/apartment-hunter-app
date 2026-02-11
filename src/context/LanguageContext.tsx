import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'he' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import i18n from '../lib/i18n-setup';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('he');
    const [direction, setDirection] = useState<Direction>('rtl');

    useEffect(() => {
        const savedLang = localStorage.getItem('app-language') as Language;
        if (savedLang) {
            setLanguage(savedLang);
            setDirection(savedLang === 'he' ? 'rtl' : 'ltr');
            i18n.changeLanguage(savedLang);

            // Update document attributes
            document.documentElement.dir = savedLang === 'he' ? 'rtl' : 'ltr';
            document.documentElement.lang = savedLang;
        } else {
            // If no saved language, ensure we start with default (he)
            i18n.changeLanguage('he');
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = 'he';
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'he' ? 'en' : 'he';
        setLanguage(newLang);
        setDirection(newLang === 'he' ? 'rtl' : 'ltr');
        localStorage.setItem('app-language', newLang);

        // Update i18n instance
        i18n.changeLanguage(newLang);

        // Update document direction
        document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLang;
    };

    return (
        <LanguageContext.Provider value={{ language, direction, toggleLanguage }}>
            <div dir={direction} className="contents">
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

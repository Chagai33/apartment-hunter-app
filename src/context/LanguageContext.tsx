import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'he' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('he');
    const [direction, setDirection] = useState<Direction>('rtl');

    useEffect(() => {
        const savedLang = localStorage.getItem('app-language') as Language;
        if (savedLang) {
            setLanguage(savedLang);
            setDirection(savedLang === 'he' ? 'rtl' : 'ltr');
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'he' ? 'en' : 'he';
        setLanguage(newLang);
        setDirection(newLang === 'he' ? 'rtl' : 'ltr');
        localStorage.setItem('app-language', newLang);

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

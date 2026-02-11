import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function AppShell({ children }: { children: ReactNode }) {
    useAccessibility();
    const location = useLocation();
    const navigate = useNavigate();

    // Don't show shell on login page only
    if (location.pathname === '/login') {
        return (
            <>
                {children}
                <Toaster position="bottom-center" />
            </>
        );
    }

    const isLanding = location.pathname === '/';
    const showBackButton = location.pathname !== '/' && location.pathname !== '/login';
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className={`flex-grow w-full ${!isLanding ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6' : ''}`}>
                {showBackButton && (
                    <div className="mb-4 flex">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                            aria-label={t('common.back')}
                        >
                            {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                            <span>{t('common.back')}</span>
                        </button>
                    </div>
                )}
                {children}
            </main>
            <Footer />
            <Toaster position="bottom-center" />
        </div>
    );
}

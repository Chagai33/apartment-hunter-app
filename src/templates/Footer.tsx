import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-white border-t py-2 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Shield size={14} />
                        <span className="text-xs">
                            {t('footer.developedBy')} <a href="https://portfolio-h.com" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-blue-600 transition-colors">{t('footer.developerName')}</a>
                        </span>
                    </div>

                    <div className="flex gap-3 text-xs text-gray-500">
                        <Link to="/terms" className="hover:text-blue-600 transition-colors">
                            {t('footer.terms')}
                        </Link>
                        <Link to="/privacy" className="hover:text-blue-600 transition-colors">
                            {t('footer.privacy')}
                        </Link>
                        <Link to="/accessibility" className="hover:text-blue-600 transition-colors">
                            {t('footer.accessibility')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}


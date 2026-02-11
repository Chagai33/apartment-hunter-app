import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-gray-50 border-t border-gray-100 py-3 mt-auto">
            <div className="max-w-4xl mx-auto px-4 text-center flex flex-col gap-2">

                {/* Developer Credit */}
                <div className="text-xs text-gray-500">
                    {t('footer.developedBy')} <a
                        href="https://www.linkedin.com/in/chagai-yechiel/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium"
                    >
                        {t('footer.developerName')}
                    </a>
                </div>

                {/* Legal Links - Minimal */}
                <nav className="flex justify-center items-center gap-2 text-[10px] text-gray-400">
                    <Link to="/terms" className="hover:text-gray-600 transition-colors">
                        {t('footer.terms')}
                    </Link>
                    <span>•</span>
                    <Link to="/privacy" className="hover:text-gray-600 transition-colors">
                        {t('footer.privacy')}
                    </Link>
                    <span>•</span>
                    <Link to="/accessibility" className="hover:text-gray-600 transition-colors">
                        {t('footer.accessibility')}
                    </Link>
                </nav>
            </div>
        </footer>
    );
}

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function EmptyState() {
    const { t } = useTranslation();

    return (
        <div className="text-center py-12">
            <div className="bg-gray-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🏠</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('dashboard.emptyTitle')}</h3>
            <p className="text-gray-500 mb-6">{t('dashboard.emptySubtitle')}</p>
            <Link to="/add" className="text-blue-600 font-medium hover:underline">
                {t('dashboard.cta')}
            </Link>
        </div>
    );
}

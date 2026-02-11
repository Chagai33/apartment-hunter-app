import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function AccessibilityStatement() {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto p-6 md:py-12">
            <Link to="/" className="text-blue-600 hover:underline mb-8 inline-block">
                &larr; {t('common.back')}
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('footer.accessibility')}</h1>
                <p className="mb-4 text-gray-700">
                    {t('accessibility.statement', 'This app is designed to be accessible to all users, adhering to WCAG 2.2 AA standards. Features include semantic HTML, focus management, and ARIA support.')}
                </p>
                <div className="space-y-2 text-gray-600">
                    <p>{t('accessibility.features.focus', 'Focus trapping in modals')}</p>
                    <p>{t('accessibility.features.aria', 'Screen reader announcements')}</p>
                    <p>{t('accessibility.features.contrast', 'High contrast text')}</p>
                </div>
            </div>
        </div>
    );
}

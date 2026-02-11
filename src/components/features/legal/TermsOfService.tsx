import { useTranslation } from 'react-i18next';
import { ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsOfService() {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto p-6 md:py-12">
            <Link to="/" className="text-blue-600 hover:underline mb-8 inline-block">
                &larr; {t('common.back')}
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <ScrollText className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">{t('footer.terms')}</h1>
                </div>

                <div className="prose max-w-none text-gray-700 space-y-6">
                    <p>Last Updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
                    <p>
                        By accessing and using Apartment Hunter, you accept and agree to be bound by the terms
                        and provision of this agreement.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900">2. Use License</h2>
                    <p>
                        Permission is granted to temporarily download one copy of the materials (information or software)
                        on Apartment Hunter's website for personal, non-commercial transitory viewing only.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900">3. Disclaimer</h2>
                    <p>
                        The materials on Apartment Hunter's website are provided "as is". Apartment Hunter makes no warranties,
                        expressed or implied, and hereby disclaims and negates all other warranties.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900">4. Limitations</h2>
                    <p>
                        In no event shall Apartment Hunter or its suppliers be liable for any damages (including, without limitation,
                        damages for loss of data or profit, or due to business interruption) arising out of the use or inability
                        to use the materials on Apartment Hunter's Internet site.
                    </p>
                </div>
            </div>
        </div>
    );
}

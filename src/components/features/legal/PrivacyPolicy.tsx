import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto p-6 md:py-12">
            <Link to="/" className="text-blue-600 hover:underline mb-8 inline-block">
                &larr; {t('common.back')}
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">{t('footer.privacy')}</h1>
                </div>

                <div className="prose max-w-none text-gray-700 space-y-6">
                    <p>Last Updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
                    <p>
                        When you use Apartment Hunter with Google Sign-In, we collect basic profile information
                        (name, email address, and profile picture) to create your account and identify you.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
                    <p>
                        We use this information solely to:
                    </p>
                    <ul className="list-disc ps-5 space-y-1">
                        <li>Authenticate you and secure your account.</li>
                        <li>Sync your apartment data across devices.</li>
                        <li>Enable sharing features with partners/roommates (if you choose to use them).</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-900">3. Data Sharing</h2>
                    <p>
                        We do not sell your personal data to third parties. Your data is stored securely in Google Firebase.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900">4. User Rights</h2>
                    <p>
                        You have the right to request deletion of your account and all associated data at any time
                        by contacting support or using the delete account feature in settings.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;

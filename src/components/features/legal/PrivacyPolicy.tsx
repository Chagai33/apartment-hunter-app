import { Link } from 'react-router-dom';
import { HE } from '../../../lib/i18n';

export function PrivacyPolicy() {
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{HE.footer.privacy}</h1>
            <p className="mb-4">
                This is a placeholder for the Privacy Policy. In a real application, this would contain
                detailed information about data collection, usage, and storage.
            </p>
            <Link to="/" className="text-blue-600 hover:underline">{HE.common.back}</Link>
        </div>
    );
}

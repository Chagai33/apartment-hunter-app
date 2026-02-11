import { Link } from 'react-router-dom';
import { HE } from '../../../lib/i18n';

export function AccessibilityStatement() {
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{HE.footer.accessibility}</h1>
            <p className="mb-4">
                This app is designed to be accessible to all users, adhering to WCAG 2.2 AA standards.
                Features include semantic HTML, focus management, and ARIA support.
            </p>
            <Link to="/" className="text-blue-600 hover:underline">{HE.common.back}</Link>
        </div>
    );
}

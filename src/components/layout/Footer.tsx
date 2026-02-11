import { Link } from 'react-router-dom';
import { HE } from '../../lib/i18n';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-auto">
            <div className="max-w-4xl mx-auto px-4 text-center">

                {/* Developer Credit */}
                <div className="mb-4 text-sm font-medium text-gray-700">
                    {HE.footer.developer} <a
                        href="https://www.linkedin.com/in/chagai-yechiel/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                        {HE.footer.creditName}
                    </a>
                </div>

                {/* Legal Links - Compact */}
                <nav aria-label={HE.footer.legal} className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                    <Link to="/terms" className="hover:text-gray-900 transition-colors">
                        {HE.footer.terms}
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link to="/privacy" className="hover:text-gray-900 transition-colors">
                        {HE.footer.privacy}
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link to="/accessibility" className="hover:text-gray-900 transition-colors">
                        {HE.footer.accessibility}
                    </Link>
                </nav>

                <p className="mt-4 text-[10px] text-gray-400">
                    &copy; {currentYear} Apartment Hunter. {HE.footer.rights}.
                </p>
            </div>
        </footer>
    );
}

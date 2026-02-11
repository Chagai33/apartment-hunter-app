import { LogOut, User as UserIcon, Globe, ArrowRight, Settings, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { HE } from '../../lib/i18n';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function Navbar() {
    const { logout, user } = useAuth();
    const { toggleLanguage } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const showBackButton = location.pathname !== '/';

    return (
        <nav className="h-16 border-b flex items-center justify-between px-4 sticky top-0 bg-white z-50 shadow-sm">
            <div className="flex items-center gap-3">
                {showBackButton ? (
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label={HE.common.back}
                    >
                        <ArrowRight size={24} />
                    </button>
                ) : (
                    <Link
                        to="/settings"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title={HE.nav.settings}
                    >
                        <Settings size={24} />
                    </Link>
                )}

                {/* Logo / App Name */}
                <Link to="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                    {HE.nav.appName}
                </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {user && (
                    <Link
                        to="/groups"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title={HE.groups.title}
                    >
                        <Users size={24} />
                    </Link>
                )}

                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1"
                    title={HE.nav.toggleLang}
                >
                    <Globe size={20} />
                </button>

                {user && (
                    <>
                        {/* User Info */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                            <span className="text-sm font-medium text-gray-700">
                                {HE.nav.hello} {user.displayName || user.email?.split('@')[0]}
                            </span>
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full" />
                            ) : (
                                <UserIcon size={16} className="text-gray-400" />
                            )}
                        </div>

                        {/* Logout */}
                        <button
                            onClick={logout}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title={HE.nav.logout}
                        >
                            <LogOut size={20} />
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}

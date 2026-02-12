import { LogOut, User as UserIcon, Globe, Settings, Users, Trash2, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { GroupSwitcher } from '../features/groups/GroupSwitcher'; // Import GroupSwitcher

export function Navbar() {
    const { logout, user } = useAuth();
    const { activeGroupId } = useGroup();
    const { toggleLanguage } = useLanguage();
    const { t } = useTranslation();

    return (
        <nav className="h-16 border-b bg-white sticky top-0 z-50 shadow-sm transition-all">
            <div className="w-full max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {user ? (
                        <Link
                            to="/settings"
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            title={t('nav.settings')}
                        >
                            <Settings size={24} />
                        </Link>
                    ) : null}

                    {/* Logo / App Name & Context Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                        <Link to="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                            {t('nav.appName')}
                        </Link>
                        {user && <GroupSwitcher />}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {user && (
                        <>
                            <Link
                                to="/groups"
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                title={t('groups.title')}
                            >
                                <Users size={24} />
                            </Link>
                            <Link
                                to="/trash"
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                title={t('nav.trash', 'Trash')}
                            >
                                <Trash2 size={24} />
                            </Link>
                        </>
                    )}

                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1"
                        title={t('nav.toggleLang')}
                    >
                        <Globe size={20} />
                    </button>

                    {user && (
                        <>
                            {/* User Info */}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <span className="text-sm font-medium text-gray-700">
                                    {t('nav.hello')} {user.displayName || user.email?.split('@')[0]}
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
                                title={t('nav.logout')}
                            >
                                <LogOut size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

import { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, Globe, Settings, Users, Trash2, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { GroupSwitcher } from '../components/features/groups/GroupSwitcher';

export function Header() {
    const { logout, user } = useAuth();
    const { groups } = useGroup();
    const { toggleLanguage } = useLanguage();
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <header className="min-h-[4rem] py-3 border-b bg-white sticky top-0 z-50 shadow-sm transition-all flex flex-col justify-center">
            {/* Main Row */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between min-h-[4rem] py-2">

                {/* Left Side: Logo & Group Switcher */}
                <div className="flex items-center gap-2 sm:gap-4 w-auto">
                    {/* Logo / App Name */}
                    <Link to="/" className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors whitespace-nowrap" onClick={closeMenu}>
                        {t('nav.appName')}
                    </Link>

                    {/* Desktop Context Badge / Group Switcher (Hidden on Mobile) */}
                    {user && groups.length > 1 && (
                        <div className="hidden sm:block">
                            <GroupSwitcher />
                        </div>
                    )}
                </div>

                {/* Right Side: Actions & Hamburger Menu */}
                <div className="flex items-center gap-1 sm:gap-3">

                    {/* Language Toggle - Outside menu for easy access */}
                    <button
                        onClick={toggleLanguage}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1"
                        title={t('nav.toggleLang')}
                    >
                        <Globe size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* --- DESKTOP ACTIONS --- */}
                    <div className="hidden sm:flex items-center gap-2">
                        {user && (
                            <>
                                <Link
                                    to="/workspace-settings"
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                    title={t('nav.settings')}
                                >
                                    <Settings size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                                </Link>
                                <Link
                                    to="/groups"
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                    title={t('groups.title')}
                                >
                                    <Users size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                                </Link>
                                <Link
                                    to="/trash"
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                    title={t('nav.trash', 'Trash')}
                                >
                                    <Trash2 size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                                </Link>

                                {/* User Info */}
                                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 ml-2">
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
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors ml-1"
                                    title={t('nav.logout')}
                                >
                                    <LogOut size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* --- MOBILE HAMBURGER MENU --- */}
                    {user && (
                        <div className="sm:hidden relative" ref={menuRef}>
                            <button
                                onClick={toggleMenu}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex items-center"
                                aria-label="Menu"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full ml-1 border border-gray-200" />
                                ) : null}
                            </button>

                            {/* Dropdown Content */}
                            {isMenuOpen && (
                                <div className="absolute ltr:right-0 rtl:left-0 rtl:right-auto mt-2 w-56 bg-white rounded-md shadow-lg py-1 border border-gray-100 flex flex-col z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {t('nav.hello')} {user.displayName || user.email?.split('@')[0]}
                                        </p>
                                    </div>

                                    <Link
                                        to="/workspace-settings"
                                        onClick={closeMenu}
                                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <Settings size={18} className="mr-3 text-gray-500" />
                                        {t('nav.settings')}
                                    </Link>
                                    <Link
                                        to="/groups"
                                        onClick={closeMenu}
                                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <Users size={18} className="mr-3 text-gray-500" />
                                        {t('groups.title')}
                                    </Link>
                                    <Link
                                        to="/trash"
                                        onClick={closeMenu}
                                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={18} className="mr-3 text-gray-500" />
                                        {t('nav.trash', 'Trash')}
                                    </Link>

                                    <div className="border-t border-gray-100 mt-1">
                                        <button
                                            onClick={() => { logout(); closeMenu(); }}
                                            className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                                        >
                                            <LogOut size={18} className="mr-3 text-red-500" />
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Context Badge / Group Switcher (Hidden on Desktop) */}
            {user && groups.length > 1 && (
                <div className="w-full max-w-7xl mx-auto px-4 pb-3 sm:hidden">
                    <GroupSwitcher />
                </div>
            )}
        </header>
    );
}


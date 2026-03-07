import { useState } from 'react';

import { useGroup } from '../../../context/GroupContext';
import { PreferencesForm } from '../preferences/PreferencesForm';
import { useTranslation } from 'react-i18next';
import { Settings, Users, CheckSquare, Trash2, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import { Link, Navigate } from 'react-router-dom';
import { GroupMembersList } from './GroupMembersList';
import { ApartmentTrash } from '../apartments/ApartmentTrash';
import { ChecklistManager } from '../checklists/ChecklistManager';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Input } from '../../common/Input';

export function WorkspaceSettings() {
    const { t } = useTranslation();
    const { activeGroupId, groups } = useGroup();
    const activeGroup = groups.find(g => g.id === activeGroupId);

    // Tabs: 'preferences' | 'members' | 'checklist' | 'trash' | 'account'
    const [activeTab, setActiveTab] = useState<'preferences' | 'members' | 'checklist' | 'trash' | 'account'>('preferences');
    const { user, deleteAccount, reauthenticate } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Re-auth states
    const [showReauthModal, setShowReauthModal] = useState(false);
    const [reauthPassword, setReauthPassword] = useState('');
    const [isReauthenticating, setIsReauthenticating] = useState(false);
    const providerId = user?.providerData[0]?.providerId;

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccount();
            toast.success(t('settings.accountDeleted', 'Account deleted successfully'));
        } catch (error: any) {
            console.error("Failed to delete account", error);
            if (error?.code === 'auth/requires-recent-login' || error?.message?.includes('requires-recent-login')) {
                setShowDeleteModal(false);
                setShowReauthModal(true);
            } else {
                toast.error(t('settings.accountDeleteFailed', 'Failed to delete account. Please try again later.'));
            }
            setIsDeleting(false);
        }
    };

    const handleReauthAndRetry = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsReauthenticating(true);
        try {
            await reauthenticate(reauthPassword);
            setShowReauthModal(false);
            setReauthPassword('');
            // Retry deletion
            await handleDeleteAccount();
        } catch (error: any) {
            console.error(error);
            toast.error(t('settings.reauthFailed', 'אימות נכשל, אנא ודא שהפרטים נכונים ונסה שוב.'));
            setIsReauthenticating(false);
        }
    };

    if (!activeGroupId || !activeGroup) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="p-4 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-600"><LayoutDashboard size={20} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{activeGroup.name}</h1>
                        <p className="text-sm text-gray-500">{t('settings.groupSettings', 'Workspace Settings')}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <TabButton
                    active={activeTab === 'preferences'}
                    onClick={() => setActiveTab('preferences')}
                    icon={<Settings size={16} />}
                    label={t('settings.searchCriteria', 'Preferences')}
                />
                <TabButton
                    active={activeTab === 'members'}
                    onClick={() => setActiveTab('members')}
                    icon={<Users size={16} />}
                    label={t('groups.members', 'Members')}
                />
                <TabButton
                    active={activeTab === 'checklist'}
                    onClick={() => setActiveTab('checklist')}
                    icon={<CheckSquare size={16} />}
                    label={t('settings.customChecklist', 'Checklist')}
                />
                <TabButton
                    active={activeTab === 'account'}
                    onClick={() => setActiveTab('account')}
                    icon={<Settings size={16} />}
                    label={t('settings.account', 'Account')}
                />
                <TabButton
                    active={activeTab === 'trash'}
                    onClick={() => setActiveTab('trash')}
                    icon={<Trash2 size={16} />}
                    label={t('nav.trash', 'Trash')}
                    variant="danger"
                />
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border min-h-[500px] overflow-hidden">
                {activeTab === 'preferences' && (
                    <PreferencesForm hideHeader={true} />
                )}
                {activeTab === 'members' && (
                    <div className="p-4">
                        <GroupMembersList group={activeGroup} />
                    </div>
                )}
                {activeTab === 'checklist' && (
                    <div className="p-4">
                        <ChecklistManager />
                    </div>
                )}
                {activeTab === 'trash' && (
                    <div className="p-4">
                        <ApartmentTrash key={activeGroupId || 'dashboard'} embedded={true} />
                    </div>
                )}
                {activeTab === 'account' && (
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('settings.accountOptions', 'Account Options')}</h2>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                            <h3 className="text-lg font-bold text-red-800 mb-2">{t('settings.dangerZone', 'Danger Zone')}</h3>
                            <p className="text-sm text-red-600 mb-4">
                                {t('settings.deleteWarning', 'Once you delete your account, there is no going back. This will permanently erase all your personal data.')}
                            </p>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
                            >
                                {t('settings.deleteAccount', 'Delete Account')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl p-6 text-center">
                        <h3 className="text-xl font-bold text-red-600 mb-4">{t('settings.confirmDeleteAccountTitle', 'Delete Account?')}</h3>
                        <p className="text-gray-700 mb-6">
                            {t('settings.confirmDeleteAccountBody', 'This action cannot be undone. All your personal data and authentication records will be permanently erased.')}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                            >
                                {isDeleting ? t('common.loading', 'Deleting...') : t('settings.confirmDelete', 'Yes, Delete My Account')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Re-Authentication Modal */}
            {showReauthModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl p-6 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('settings.verifyIdentity', 'Verify Your Identity')}</h3>
                        <p className="text-gray-600 mb-6">
                            {t('settings.verifyIdentityBody', 'למען אבטחת המידע שלך, יש לבצע אימות מחדש כדי למחוק את החשבון.')}
                        </p>

                        <form onSubmit={handleReauthAndRetry} className="flex flex-col gap-4">
                            {providerId === 'password' && (
                                <Input
                                    type="password"
                                    placeholder={t('settings.enterPassword', 'Enter your password')}
                                    value={reauthPassword}
                                    onChange={(e) => setReauthPassword(e.target.value)}
                                    required
                                    autoFocus
                                />
                            )}

                            <div className="flex gap-4 justify-center mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReauthModal(false);
                                        setReauthPassword('');
                                    }}
                                    disabled={isReauthenticating}
                                    className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isReauthenticating || (providerId === 'password' && !reauthPassword)}
                                    className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                                >
                                    {isReauthenticating ? t('common.loading', 'Verifying...') : (providerId === 'google.com' ? t('settings.verifyWithGoogle', 'אימות עם גוגל') : t('settings.verifyAndContinue', 'Verify & Delete'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, icon, label, variant = 'primary' }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, variant?: 'primary' | 'danger' }) {
    const baseClasses = "px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap";

    if (active) {
        return (
            <button onClick={onClick} className={clsx(baseClasses, variant === 'danger' ? "bg-red-600 text-white shadow" : "bg-blue-600 text-white shadow")}>
                {icon}
                {label}
            </button>
        );
    }

    return (
        <button onClick={onClick} className={clsx(baseClasses, variant === 'danger' ? "bg-white text-red-600 hover:bg-red-50" : "bg-white text-gray-600 hover:bg-gray-100")}>
            {icon}
            {label}
        </button>
    );
}

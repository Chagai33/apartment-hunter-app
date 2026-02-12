import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { PreferencesForm } from '../preferences/PreferencesForm';
import { useTranslation } from 'react-i18next';
import { Settings, Users, CheckSquare, Trash2, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import { Link, Navigate } from 'react-router-dom';
import { GroupMembersList } from './GroupMembersList';
import { ApartmentTrash } from '../apartments/ApartmentTrash';
import { ChecklistManager } from '../checklists/ChecklistManager';

export function WorkspaceSettings() {
    const { t } = useTranslation();
    const { activeGroupId, groups } = useGroup();
    const activeGroup = groups.find(g => g.id === activeGroupId);

    // Tabs: 'preferences' | 'members' | 'checklist' | 'trash'
    const [activeTab, setActiveTab] = useState<'preferences' | 'members' | 'checklist' | 'trash'>('preferences');

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
            </div>
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

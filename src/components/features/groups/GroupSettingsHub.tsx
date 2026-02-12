
import { useState } from 'react';

import { useGroup } from '../../../context/GroupContext';
import { PreferencesForm } from '../preferences/PreferencesForm'; // Reuse existing

import { useTranslation } from 'react-i18next';
import { Settings, Users, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';


// We will extract the "Members" part of GroupManagement into a separate component later, 
// for now let's imagine we have a `GroupMembersSettings` component.
// Or we can simple inline the member management logic here if we refactor GroupManagement.

export function GroupSettingsHub() {
    const { t } = useTranslation();
    const { activeGroupId, groups } = useGroup();
    const activeGroup = groups.find(g => g.id === activeGroupId);

    // Tabs: 'preferences' | 'members' | 'checklists'
    const [activeTab, setActiveTab] = useState<'preferences' | 'members'>('preferences');

    if (!activeGroupId) {
        // Personal Mode
        return (
            <div className="p-4 bg-gray-50 min-h-screen pb-24">
                <div className="flex items-center gap-2 mb-4">
                    <Link to="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100"><LayoutDashboard size={20} /></Link>
                    <h1 className="text-2xl font-bold">{t('agentMode.personalWorkspace')}</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <PreferencesForm />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-600"><LayoutDashboard size={20} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{activeGroup?.name}</h1>
                        <p className="text-sm text-gray-500">{t('settings.groupSettings', 'Group Settings')}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('preferences')}
                    className={clsx("px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                        activeTab === 'preferences' ? "bg-blue-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"
                    )}
                >
                    <Settings size={16} />
                    {t('settings.searchCriteria', 'Search Criteria')}
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={clsx("px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                        activeTab === 'members' ? "bg-blue-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"
                    )}
                >
                    <Users size={16} />
                    {t('groups.members', 'Members')}
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border min-h-[500px]">
                {activeTab === 'preferences' && (
                    <PreferencesForm />
                )}
                {activeTab === 'members' && (
                    <div className="p-4">
                        {/* 
                            Here we will render the Member Management logic.
                            I should refactor GroupManagement.tsx to export a `GroupMembersList` component 
                            so I can use it here without the "My Groups" switcher.
                        */}
                        <p>Members Component Placeholder</p>
                    </div>
                )}
            </div>
        </div>
    );
}

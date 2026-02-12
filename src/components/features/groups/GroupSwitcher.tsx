import { useGroup } from '../../../context/GroupContext';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Briefcase, LayoutDashboard } from 'lucide-react';

export function GroupSwitcher() {
    const { groups, activeGroupId, selectGroup } = useGroup();
    const { t } = useTranslation();

    // If user has no groups, or just 1 group, we might want to hide this or show a static badge?
    // Requirement says: behavior: "Option 1: Dashboard... if groups.length > 1"
    // So if groups.length <= 1, maybe just show the single group name or nothing?
    // Let's stick to the requirement: Render a Dropdown.

    if (groups.length === 0) return null;

    // Single group view - static badge
    if (groups.length === 1) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                <Briefcase size={14} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{groups[0].name}</span>
            </div>
        );
    }

    // If only 1 group, and we are auto-selected into it, maybe just show the name?
    // But for consistency let's keep it as a switcher or at least a display.
    // Actually, if length === 1, the context auto-selects it.
    // So activeGroupId will be set.
    // Let's render the dropdown anyway to allow "Dashboard" view? 
    // Requirement: "Option 1: 'Dashboard' ... Show this ONLY if groups.length > 1".
    // So if length === 1, we don't show the "Dashboard" option.
    // If length === 1, effectively it's just a single item.

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        selectGroup(val === "" ? null : val);
    };

    return (
        <div className="relative group max-w-[200px]">
            <div className="flex w-full items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors cursor-pointer">
                {activeGroupId ? <Briefcase size={14} className="text-blue-600" /> : <LayoutDashboard size={14} className="text-purple-600" />}

                <select
                    value={activeGroupId || ""}
                    onChange={handleChange}
                    className="appearance-none bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer pr-6 py-0 focus:outline-none w-full"
                    style={{ backgroundImage: 'none' }} // Remove default arrow
                >
                    <option value="">{t('groups.dashboard', 'Dashboard (All)')}</option>

                    {groups.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.name}
                        </option>
                    ))}
                </select>

                <ChevronDown size={14} className="text-gray-400 absolute right-3 pointer-events-none" />
            </div>
        </div>
    );
}

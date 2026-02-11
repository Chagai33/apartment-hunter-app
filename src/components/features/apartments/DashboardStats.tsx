import { HE } from '../../../lib/i18n';

interface DashboardStatsProps {
    stats: {
        total: number;
        seen: number;
        favorites: number;
    };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 text-center">
                <span className="block text-2xl font-bold text-blue-600">{stats.total}</span>
                <span className="text-xs text-gray-500">{HE.dashboard.total}</span>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100 text-center">
                <span className="block text-2xl font-bold text-purple-600">{stats.seen}</span>
                <span className="text-xs text-gray-500">{HE.dashboard.seen}</span>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-pink-100 text-center">
                <span className="block text-2xl font-bold text-pink-600">{stats.favorites}</span>
                <span className="text-xs text-gray-500">{HE.dashboard.favorites}</span>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { Apartment, UserPreferences } from '../../../types';
import { useApartments } from '../../../hooks/useApartments';
import { ApartmentCard } from './ApartmentCard';
import { useTranslation } from 'react-i18next';
import { Plus, Filter, X, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardStats } from './DashboardStats';
import { EmptyState } from './EmptyState';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { clsx } from 'clsx';

export function ApartmentList() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { activeGroupId, groups } = useGroup();
    const { apartments, loading, error } = useApartments();

    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [filterByGroup, setFilterByGroup] = useState(false);

    // Load Preferences (Context Aware)
    useEffect(() => {
        let unsubUser = () => { };

        if (activeGroupId) {
            const currentGroup = groups.find(g => g.id === activeGroupId);
            if (currentGroup && currentGroup.preferences) {
                setPreferences(currentGroup.preferences);
            } else {
                setPreferences(null);
            }
        } else {
            // Personal Mode
            if (user) {
                unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        if (userData.preferences) {
                            setPreferences(userData.preferences);
                        } else {
                            setPreferences(null);
                        }
                    }
                });
            }
        }
        return () => unsubUser();
    }, [activeGroupId, groups, user]);


    // Match Logic (Reusable Helper)
    const checkMatch = (apartment: Apartment, prefs: UserPreferences | null) => {
        if (!prefs) return true; // No prefs = match all

        if (prefs.mustHaveElevator && !apartment.elevator) return false;
        if (prefs.mustHaveParking && !apartment.parking) return false;
        if (prefs.mustHaveBalcony && !apartment.balcony) return false;
        if (prefs.mustHaveAC && !apartment.ac) return false;
        if (prefs.mustHaveMamad && !apartment.tama38 && !apartment.notes?.includes('ממ"ד')) return false;
        if (prefs.mustHavePets && !apartment.pets) return false;
        if (prefs.mustHaveFurnished && !apartment.furnished) return false;

        if (prefs.maxPrice && apartment.price > prefs.maxPrice) return false;
        if (prefs.minRooms && (apartment.rooms || 0) < prefs.minRooms) return false;

        return true;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const unrejectedApartments = apartments.filter(a => a.status !== 'rejected' && !a.deleted);

    // Apply Smart Filter
    const displayedApartments = filterByGroup
        ? unrejectedApartments.filter(a => checkMatch(a, preferences))
        : unrejectedApartments;

    // Calculate stats (Always based on total unrejected, or displayed?)
    // Usually stats reflect the entire pool, filtering is just a view.
    const stats = {
        total: unrejectedApartments.length,
        favorites: unrejectedApartments.filter(a => a.status === 'visited').length,
        seen: unrejectedApartments.filter(a => a.status === 'visited').length
    };

    const currentGroup = groups.find(g => g.id === activeGroupId);

    return (
        <div className="p-4 pb-24">
            {/* Workspace Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {currentGroup?.name || t('nav.appName')}
                    </h1>
                    <p className="text-sm text-gray-500">{t('dashboard.subtitle', 'Welcome back')}</p>
                </div>
                <Link
                    to="/workspace-settings"
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-600 border"
                    title={t('settings.groupSettings', 'Workspace Settings')}
                >
                    <Settings size={20} />
                </Link>
            </div>

            <DashboardStats stats={stats} />

            {/* Smart Filter Bar */}
            {preferences && (
                <div className="mb-6 bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className={clsx("p-2 rounded-full", filterByGroup ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500")}>
                            <Filter size={20} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-bold block truncate">
                                {filterByGroup ? t('settings.filteringByGroup', 'Filtering matches') : t('settings.showOnlyMatches', 'Show only matches')}
                            </span>
                            <span className="text-xs text-gray-400 block truncate">
                                {preferences.maxPrice ? `${preferences.maxPrice} ₪` : ''}
                                {preferences.minRooms ? `, ${preferences.minRooms} ${t('apartment.rooms')}` : ''}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setFilterByGroup(!filterByGroup)}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                            filterByGroup
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {filterByGroup ? t('common.active') : t('common.enable')}
                    </button>
                </div>
            )}

            {/* Empty State for Filter */}
            {filterByGroup && displayedApartments.length === 0 && unrejectedApartments.length > 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-500">
                    <p>{t('settings.noMatchesFound', 'No apartments match your group settings.')}</p>
                    <button onClick={() => setFilterByGroup(false)} className="text-blue-600 font-bold text-sm mt-2">
                        {t('settings.clearFilter', 'Show all')}
                    </button>
                </div>
            ) : unrejectedApartments.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedApartments.map(apartment => (
                        <ApartmentCard
                            key={apartment.id}
                            apartment={apartment}
                            preferences={preferences} // Pass prefs to card for match badge
                        />
                    ))}
                </div>
            )}

            {/* FAB */}
            <Link
                to="/add"
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
                aria-label={t('common.add')}
            >
                <Plus size={24} />
            </Link>
        </div>
    );
}

// Components moved to separate files

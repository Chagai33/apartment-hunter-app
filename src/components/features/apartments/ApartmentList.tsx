import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { Apartment } from '../../../types';
import { useApartments } from '../../../hooks/useApartments';
import { ApartmentCard } from './ApartmentCard';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardStats } from './DashboardStats'; // Assuming this exists or will be created
import { EmptyState } from './EmptyState'; // Assuming this exists or will be created

export function ApartmentList() {
    const { t } = useTranslation();
    const { apartments, loading, error } = useApartments();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const unrejectedApartments = apartments.filter(a => a.status !== 'rejected' && !a.deleted);

    // Calculate stats
    const stats = {
        total: unrejectedApartments.length,
        favorites: unrejectedApartments.filter(a => a.status === 'visited').length, // Using visited as "favorites" rough proxy or add favorite field later
        seen: unrejectedApartments.filter(a => a.status === 'visited').length
    };

    return (
        <div className="p-4 pb-24">
            {/* Dashboard Stats */}
            <DashboardStats stats={stats} />

            {/* List */}
            {unrejectedApartments.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unrejectedApartments.map(apartment => (
                        <ApartmentCard key={apartment.id} apartment={apartment} />
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

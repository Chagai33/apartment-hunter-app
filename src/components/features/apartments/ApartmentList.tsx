import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Apartment } from '../../../types';
import { ApartmentCard } from './ApartmentCard';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardStats } from './DashboardStats'; // Assuming this exists or will be created
import { EmptyState } from './EmptyState'; // Assuming this exists or will be created

export function ApartmentList() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [userGroupId, setUserGroupId] = useState<string | null>(null);

    // 1. Listen for User Profile Changes (to get groupId real-time)
    useEffect(() => {
        if (!user) return;

        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setUserGroupId(data.groupId || null);
            }
        });

        return () => unsubUser();
    }, [user]);

    // 2. Listen for Apartments based on groupId or userId
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        // Query logic:
        let q;

        if (userGroupId) {
            // Group mode: Show apartments belonging to the group
            q = query(
                collection(db, 'apartments'),
                where('groupId', '==', userGroupId),
                orderBy('createdAt', 'desc')
            );
        } else {
            // Private mode: Show personal apartments
            q = query(
                collection(db, 'apartments'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newApartments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Apartment));

            setApartments(newApartments);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching apartments:", error);
            setLoading(false);
        });

        // Safety timeout
        const timeoutId = setTimeout(() => {
            setLoading((currentLoading) => {
                if (currentLoading) {
                    console.warn("ApartmentList loading timed out");
                    return false;
                }
                return currentLoading;
            });
        }, 5000);

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [user, userGroupId]);

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

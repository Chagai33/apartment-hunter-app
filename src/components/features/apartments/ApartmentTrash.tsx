import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, QuerySnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { Apartment } from '../../../types';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function ApartmentTrash({ embedded }: { embedded?: boolean }) {
    const { user } = useAuth();
    const { activeGroupId, groups } = useGroup();
    const { t } = useTranslation();
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Deleted Apartments
    useEffect(() => {
        if (!user) {
            setApartments([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setApartments([]); // Clear previous state to prevent stale data display

        // Strict filtering: If activeGroupId is set, ONLY show that group.
        // If no activeGroupId (Dashboard), show from all user's groups involved.
        const groupIds = activeGroupId ? [activeGroupId] : groups.map(g => g.id).slice(0, 10);

        if (groupIds.length === 0) {
            setApartments([]);
            setLoading(false);
            return;
        }

        try {
            // Note: querying with 'in' and '== true' usually requires an index.
            // If this fails, we might need to fetch all and filter client side or create index.
            // For now, let's try strict filtering.
            // Optimization: If index missing, we can fetch by groupId only and filter in memory.
            // Given the volume of "trash" is likely low, filtering active apartments might be heavy.
            // Let's rely on Firestore. worst case console will tell us to create index.

            const q = query(
                collection(db, 'apartments'),
                where('groupId', 'in', groupIds),
                where('deleted', '==', true),
                orderBy('deletedAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
                const fetchedApartments: Apartment[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                    id: doc.id,
                    ...doc.data()
                } as Apartment))
                    // Strict client-side filtering to ensure no cross-group contamination
                    .filter((a: Apartment) => groupIds.includes(a.groupId));

                setApartments(fetchedApartments);
                setLoading(false);
            }, (error: any) => {
                console.error("Error fetching trash:", error);

                // Fallback: fetch without ordering if index issue with compound query
                if (error.code === 'failed-precondition') {
                    console.warn("Index missing for Trash query. Fallback to client-side sort/filter if needed.");
                    setLoading(false);
                } else {
                    toast.error(t('common.error'));
                    setLoading(false);
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    }, [user, activeGroupId, groups, t]);

    const handleRestore = async (apartmentId: string) => {
        try {
            await updateDoc(doc(db, 'apartments', apartmentId), {
                deleted: false,
                deletedAt: null
            });
            toast.success(t('common.restoreSuccess') || "Items restored");
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const handlePermanentDelete = async (apartmentId: string) => {
        if (!confirm(t('common.confirmPermanentDelete') || "Are you sure? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'apartments', apartmentId));
            toast.success(t('common.deleteSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

    return (
        <div className={embedded ? "" : "p-4 pb-24"}>
            {!embedded && (
                <div className="flex items-center gap-3 mb-6">
                    <Link to="/settings" className="p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold">{t('common.trash')}</h1>
                </div>
            )}

            {apartments.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <Trash2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{t('common.emptyTrash')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {apartments.map(apartment => (
                        <div key={apartment.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900">{apartment.address}</h3>
                                <p className="text-sm text-gray-500">{apartment.neighborhood} • {apartment.price.toLocaleString()} ₪</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRestore(apartment.id)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                    title={t('common.restore')}
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <button
                                    onClick={() => handlePermanentDelete(apartment.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                    title={t('common.deletePermanently')}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

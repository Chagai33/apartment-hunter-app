import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Apartment } from '../../../types';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function ApartmentTrash() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [userGroupId, setUserGroupId] = useState<string | null>(null);

    // 1. Get Group ID
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

    // 2. Fetch deleted apartments
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        let q;
        if (userGroupId) {
            q = query(
                collection(db, 'apartments'),
                where('groupId', '==', userGroupId),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(
                collection(db, 'apartments'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const deleted = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Apartment))
                .filter(a => a.deleted === true); // Filter client-side for simplicity

            setApartments(deleted);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching trash:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userGroupId]);

    const handleRestore = async (id: string) => {
        try {
            await updateDoc(doc(db, 'apartments', id), {
                deleted: false,
                deletedAt: null
            });
            toast.success(t('common.restoreSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const handlePermanentDelete = async (id: string) => {
        if (!confirm(t('common.deletePermanentConfirm'))) return;
        try {
            await deleteDoc(doc(db, 'apartments', id));
            toast.success(t('common.deletePermanentSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

    return (
        <div className="p-4 pb-24">
            <div className="flex items-center gap-3 mb-6">
                <Link to="/settings" className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold">{t('common.trash')}</h1>
            </div>

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

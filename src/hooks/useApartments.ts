import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { Apartment } from '../types';

export function useApartments() {
    const { user } = useAuth();
    const { activeGroupId, groups } = useGroup();
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setApartments([]);
            setLoading(false);
            return;
        }

        // Dashboard view with no groups -> empty result
        if (!activeGroupId && groups.length === 0) {
            setApartments([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        let q;

        try {
            if (activeGroupId) {
                // Scenario A: Active Group Selected
                // Query apartments belonging specifically to the active group
                q = query(
                    collection(db, 'apartments'),
                    where('groupId', '==', activeGroupId),
                    orderBy('createdAt', 'desc')
                );
            } else {
                // Scenario B: Dashboard View (All user's groups)
                // We need to fetch apartments from ALL groups the user belongs to.
                // Firestore 'in' query is limited to 10 items.
                const groupIds = groups.map(g => g.id);

                // If user has many groups, we slice the first 10 for now.
                // Ideally, we'd fetch all (chunked) or filter differently?
                // But per requirements, limit to 10 slice.
                const targetIds = groupIds.slice(0, 10);

                if (targetIds.length === 0) {
                    setApartments([]);
                    setLoading(false);
                    return;
                }

                q = query(
                    collection(db, 'apartments'),
                    where('groupId', 'in', targetIds),
                    orderBy('createdAt', 'desc')
                );
            }

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedApartments: Apartment[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Apartment));
                setApartments(fetchedApartments);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching apartments:", err);
                setError("Failed to fetch apartments.");
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Error setting up apartment listener:", err);
            setError("Error setting up listener");
            setLoading(false);
        }
    }, [user, activeGroupId, groups]);

    const addApartment = async (apartmentData: Omit<Apartment, 'id'>, targetGroupId?: string) => {
        if (!user) throw new Error("User must be logged in to add an apartment");

        const effectiveGroupId = activeGroupId || targetGroupId;

        if (!effectiveGroupId) {
            throw new Error("Target Group ID is required when no active group is selected.");
        }

        try {
            await addDoc(collection(db, 'apartments'), {
                ...apartmentData,
                groupId: effectiveGroupId,
                userId: user.uid, // Owner/Original uploader
                createdBy: user.uid, // Creator for audit
                createdAt: Date.now(), // Using timestamp number
                updatedAt: Date.now()
            });
        } catch (err) {
            console.error("Error adding apartment:", err);
            throw err;
        }
    };

    const deleteApartment = async (apartmentId: string) => {
        try {
            await deleteDoc(doc(db, 'apartments', apartmentId));
        } catch (err) {
            console.error("Error deleting apartment:", err);
            throw err;
        }
    };

    const updateApartment = async (apartmentId: string, updates: Partial<Apartment>) => {
        try {
            await updateDoc(doc(db, 'apartments', apartmentId), {
                ...updates,
                updatedAt: Date.now()
            });
        } catch (err) {
            console.error("Error updating apartment:", err);
            throw err;
        }
    };

    return {
        apartments,
        loading,
        error,
        addApartment,
        deleteApartment,
        updateApartment
    };
}

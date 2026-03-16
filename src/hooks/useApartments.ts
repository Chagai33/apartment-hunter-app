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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
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

    const sanitizeData = (data: any) => {
        const sanitized = { ...data };
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === undefined) {
                delete sanitized[key];
            }
        });
        return sanitized;
    };

    const uploadImages = async (images: any[], apartmentId: string, userId: string) => {
        const uploadedImages: { url: string, path: string }[] = [];
        
        for (const img of images) {
            if (img.file) {
                const uuid = Math.random().toString(36).substring(2, 15);
                const fileExtension = img.file.name ? img.file.name.split('.').pop() : 'jpg';
                const imagePath = `apartments/${userId}/${apartmentId}/${uuid}.${fileExtension}`;
                const storageRef = ref(storage, imagePath);
                
                await uploadBytes(storageRef, img.file);
                const downloadUrl = await getDownloadURL(storageRef);
                
                uploadedImages.push({
                    url: downloadUrl,
                    path: imagePath
                });
            } else if (img.url && img.path) {
                // Keep existing images
                uploadedImages.push({
                    url: img.url,
                    path: img.path
                });
            }
        }
        return uploadedImages;
    };

    const addApartment = async (apartmentData: any, targetGroupId?: string) => {
        if (!user) throw new Error("User must be logged in to add an apartment");

        const effectiveGroupId = activeGroupId || targetGroupId;

        if (!effectiveGroupId) {
            throw new Error("Target Group ID is required when no active group is selected.");
        }

        try {
            // Extract raw images array before sanitization
            const rawImages = apartmentData.images || [];
            delete apartmentData.images;

            const cleanData = sanitizeData(apartmentData);
            
            // 1. Create the document first to get the ID
            const docRef = await addDoc(collection(db, 'apartments'), {
                ...cleanData,
                groupId: effectiveGroupId,
                userId: user.uid, // Owner/Original uploader
                createdBy: user.uid, // Creator for audit
                createdAt: Date.now(), // Using timestamp number
                updatedAt: Date.now(),
                images: [] // Temporary empty array
            });

            // 2. Upload images with the new document ID
            if (rawImages.length > 0) {
                const uploadedImages = await uploadImages(rawImages, docRef.id, user.uid);
                
                // 3. Update the document with image URLs
                await updateDoc(docRef, {
                    images: uploadedImages,
                    updatedAt: Date.now()
                });
            }
            
            return docRef.id;
        } catch (err) {
            console.error("Error adding apartment:", err);
            throw err;
        }
    };

    const deleteApartment = async (apartmentId: string, images?: { url: string, path: string }[]) => {
        try {
            // Delete associated images from Storage
            if (images && images.length > 0) {
                for (const img of images) {
                    if (img.path) {
                        try {
                            const imageRef = ref(storage, img.path);
                            await deleteObject(imageRef);
                        } catch (e) {
                            console.error("Failed to delete image from storage:", e);
                        }
                    }
                }
            }
            
            await deleteDoc(doc(db, 'apartments', apartmentId));
        } catch (err) {
            console.error("Error deleting apartment:", err);
            throw err;
        }
    };

    const updateApartment = async (apartmentId: string, updates: any) => {
        if (!user) throw new Error("User must be logged in to update an apartment");
        
        try {
            // Extract raw images array
            const rawImages = updates.images;
            if (rawImages !== undefined) {
                delete updates.images;
                
                // Upload new images and keep existing ones
                const uploadedImages = await uploadImages(rawImages, apartmentId, user.uid);
                updates.images = uploadedImages;
            }

            const cleanUpdates = sanitizeData(updates);
            await updateDoc(doc(db, 'apartments', apartmentId), {
                ...cleanUpdates,
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

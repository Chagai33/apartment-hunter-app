import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { Group } from '../types';

interface GroupContextType {
    groups: Group[];
    activeGroupId: string | null;
    loading: boolean;
    selectGroup: (groupId: string | null) => void;
    createGroup: (name: string, isAuto?: boolean) => Promise<string | undefined>;
}

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const hasAttemptedAutoCreation = useRef(false);



    useEffect(() => {
        if (!user) {
            setGroups([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'groups'),
            where('members', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedGroups: Group[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Group));

            setGroups(fetchedGroups);
            setLoading(false);

            // Auto-Selection Logic with Persistence
            const lastActiveId = localStorage.getItem('lastActiveGroupId');

            // 1. If only one group, force select it (Override persistence to ensure consistency)
            if (fetchedGroups.length === 1) {
                const singleGroupId = fetchedGroups[0].id;
                setActiveGroupId(singleGroupId);
                localStorage.setItem('lastActiveGroupId', singleGroupId);
            }
            // 2. If multiple groups, try to restore last active
            else if (fetchedGroups.length > 1) {
                if (lastActiveId && fetchedGroups.some(g => g.id === lastActiveId)) {
                    setActiveGroupId(lastActiveId);
                } else {
                    // Valid last active not found? 
                    // If we currently have an active group that is still valid, keep it.
                    // If not, fall back to null (Dashboard).
                    setActiveGroupId(current => {
                        if (current && fetchedGroups.some(g => g.id === current)) return current;
                        return null;
                    });
                }
            } else {
                setActiveGroupId(null);
            }
        }, (error) => {
            console.error("Group subscription error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Persist active group selection
    const selectGroup = (groupId: string | null) => {
        setActiveGroupId(groupId);
        if (groupId) {
            localStorage.setItem('lastActiveGroupId', groupId);
        } else {
            localStorage.removeItem('lastActiveGroupId');
        }
    };

    const generateInviteCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const createGroup = async (name: string, isAuto: boolean = false): Promise<string> => {
        if (!user) throw new Error("User not authenticated.");

        try {
            const newGroupData = {
                name,
                members: [user.uid],
                createdBy: user.uid,
                createdAt: Date.now(), // Use local time for optimistic update
                inviteCode: generateInviteCode(),
                isAutoCreated: isAuto,
            };

            const newGroupRef = await addDoc(collection(db, 'groups'), {
                ...newGroupData,
                createdAt: serverTimestamp(),
            });



            console.log("Group created with ID:", newGroupRef.id);

            // Optimistic update - REMOVED to avoid duplicate key warning
            // onSnapshot will handle the update automatically
            // setGroups(prev => [...prev, newGroup]);

            // Set as active group and persist
            selectGroup(newGroupRef.id);

            return newGroupRef.id;
        } catch (error) {
            console.error("Error creating group:", error);
            throw error;
        }
    };

    const contextValue: GroupContextType = {
        groups,
        activeGroupId,
        loading,
        selectGroup,
        createGroup,
    };

    return (
        <GroupContext.Provider value={contextValue}>
            {children}
        </GroupContext.Provider>
    );
}

export function useGroup() {
    const context = useContext(GroupContext);
    if (!context) throw new Error('useGroup must be used within a GroupProvider');
    return context;
}

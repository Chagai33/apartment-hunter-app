import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, doc, setDoc, updateDoc, arrayUnion, query, where, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Group } from '../../../types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Users, Copy, Check, LogOut, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function GroupManagement() {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState(false);
    const isRtl = i18n.dir() === 'rtl';

    // Listen to User's Group ID changes in real-time
    useEffect(() => {
        if (!user) return;

        // Listen to user profile to get groupId
        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (userSnap) => {
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const groupId = userData.groupId;

                if (groupId) {
                    // If user has a group, listen to that group document
                    const unsubGroup = onSnapshot(doc(db, 'groups', groupId), (groupSnap) => {
                        if (groupSnap.exists()) {
                            setCurrentGroup({ id: groupSnap.id, ...groupSnap.data() } as Group);
                        } else {
                            // Group ID exists on user but group doc missing?
                            setCurrentGroup(null);
                        }
                    }, (err) => console.error("Error fetching group:", err));

                    return () => unsubGroup();
                } else {
                    setCurrentGroup(null);
                }
            }
        });

        return () => unsubUser();
    }, [user]);

    const generateInviteCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const createGroup = async () => {
        if (!user) return;
        setLoading(true);

        // Timeout safety
        const timeoutId = setTimeout(() => {
            setLoading((current) => {
                if (current) {
                    toast.error(t('groups.errors.timeout'));
                    return false;
                }
                return current;
            });
        }, 10000);

        try {
            const code = generateInviteCode();
            const groupRef = doc(collection(db, 'groups'));

            const newGroup: any = {
                memberIds: [user.uid],
                inviteCode: code,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                name: t('groups.defaultGroupName')
            };

            // 1. Create group
            await setDoc(groupRef, newGroup);

            // 2. Update user with groupId (Using setDoc with merge to ensure it works even if user doc is missing)
            await setDoc(doc(db, 'users', user.uid), { groupId: groupRef.id }, { merge: true });

            toast.success(t('groups.createTitle'));
        } catch (error) {
            console.error(error);
            toast.error(t('groups.errors.createFailed'));
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    const joinGroup = async () => {
        if (!user || !joinCode) return;
        setLoading(true);

        const timeoutId = setTimeout(() => {
            setLoading((current) => {
                if (current) {
                    toast.error(t('groups.errors.timeout'));
                    return false;
                }
                return current;
            });
        }, 10000);

        try {
            // Find group by code (query is still one-off)
            const q = query(collection(db, 'groups'), where('inviteCode', '==', joinCode.toUpperCase().trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error(t('groups.errors.invalidCode'));
                setLoading(false);
                return;
            }

            const groupDoc = querySnapshot.docs[0];
            const groupData = groupDoc.data();

            if (groupData.memberIds.includes(user.uid)) {
                toast.error(t('groups.errors.alreadyMember'));
                setLoading(false);
                return;
            }

            // Update group and user
            await updateDoc(doc(db, 'groups', groupDoc.id), {
                memberIds: arrayUnion(user.uid)
            });

            // Upsert user doc with new group ID
            await setDoc(doc(db, 'users', user.uid), { groupId: groupDoc.id }, { merge: true });

            toast.success(t('groups.joinSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('groups.errors.joinFailed'));
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (currentGroup?.inviteCode) {
            navigator.clipboard.writeText(currentGroup.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success(t('groups.copied'));
        }
    };

    const leaveGroup = async () => {
        if (!confirm(t('groups.confirmLeave'))) return;
        if (!user || !currentGroup) return;

        try {
            const updatedMembers = currentGroup.memberIds.filter(id => id !== user.uid);
            await updateDoc(doc(db, 'groups', currentGroup.id), { memberIds: updatedMembers });

            // Using deleteField logic by assuming the app handles null/empty string, we'll set to null
            await updateDoc(doc(db, 'users', user.uid), { groupId: null });

            setCurrentGroup(null);
            toast.success(t('groups.leaveSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    if (currentGroup) {
        return (
            <div className="p-4">
                <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{t('groups.yourGroup')}</h2>
                    <p className="text-gray-500 mb-6">
                        {t('groups.members')}: {currentGroup.memberIds.length}
                    </p>

                    <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 mb-6">
                        <p className="text-sm text-gray-500 mb-1">{t('groups.inviteCode')}</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-mono font-bold tracking-wider text-gray-800">
                                {currentGroup.inviteCode}
                            </span>
                            <button
                                onClick={copyCode}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={leaveGroup}
                        className="text-red-500 text-sm hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <LogOut size={16} />
                        {t('groups.leave')}
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <Link to="/" className="text-blue-600 font-medium flex items-center justify-center gap-1 hover:underline">
                        {t('groups.backToApartments')} {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-20">
            <h1 className="text-2xl font-bold mb-6 text-center">{t('groups.title')}</h1>

            <div className="grid gap-6">
                {/* Join Group */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="font-bold text-lg mb-4 text-gray-800">{t('groups.joinTitle')}</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder={t('groups.codePlaceholder')}
                            className="flex-1 p-3 border rounded-xl text-center font-mono placeholder:font-sans uppercase"
                            maxLength={6}
                        />
                    </div>
                    <button
                        onClick={joinGroup}
                        disabled={loading || joinCode.length < 5}
                        className="w-full mt-3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('common.loading') : t('groups.join')}
                    </button>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">{t('auth.or')}</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Create Group */}
                <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
                    <h2 className="font-bold text-lg mb-2 text-gray-800">{t('groups.createTitle')}</h2>
                    <p className="text-gray-500 text-sm mb-4">{t('groups.createSubtitle')}</p>
                    <button
                        onClick={createGroup}
                        disabled={loading}
                        className="w-full bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? t('common.loading') : (
                            <>
                                <Plus size={20} />
                                {t('groups.create')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

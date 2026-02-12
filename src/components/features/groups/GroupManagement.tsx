import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { db } from '../../../lib/firebase';
import { collection, doc, setDoc, updateDoc, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp, onSnapshot, documentId, deleteField, deleteDoc, writeBatch } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Users, Copy, Check, LogOut, Plus, ArrowRight, ArrowLeft, Briefcase, Star, Pencil, X, Trash2 } from 'lucide-react'; // Added Briefcase
import { Link } from 'react-router-dom';

export function GroupManagement() {
    const { user } = useAuth();
    const { activeGroup, myGroups, switchGroup, setDefaultGroup, defaultGroupId, loading: groupLoading } = useGroup(); // Use Context
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);

    // Create/Join State
    const [joinCode, setJoinCode] = useState('');
    const [newGroupName, setNewGroupName] = useState(''); // New State

    // UI State
    const [copied, setCopied] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const isRtl = i18n.dir() === 'rtl';
    const [members, setMembers] = useState<any[]>([]);

    // Fetch members details when active group changes
    useEffect(() => {
        if (activeGroup?.memberIds?.length) {
            const q = query(collection(db, 'users'), where(documentId(), 'in', activeGroup.memberIds.slice(0, 10)));
            const unsub = onSnapshot(q, (snapshot) => {
                const membersData = snapshot.docs.map(d => ({ ...d.data(), uid: d.id }));
                setMembers(membersData);
            }, (err) => console.error("Error fetching members:", err));
            return () => unsub();
        } else {
            setMembers([]);
        }
    }, [activeGroup?.memberIds]);

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
        if (!newGroupName.trim()) {
            toast.error(t('groups.errors.missingName') || "Please enter a group name");
            return;
        }
        setLoading(true);

        try {
            const code = generateInviteCode();
            const groupRef = doc(collection(db, 'groups'));
            const groupId = groupRef.id;
            const groupName = newGroupName.trim();

            // 1. Create Group Doc
            const newGroup: any = {
                memberIds: [user.uid],
                members: { // New Role Map
                    [user.uid]: { role: 'owner', joinedAt: serverTimestamp() }
                },
                inviteCode: code,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                name: groupName
            };

            await setDoc(groupRef, newGroup);

            // 2. Create Membership Doc (Subcollection)
            await setDoc(doc(db, 'users', user.uid, 'memberships', groupId), {
                groupId: groupId,
                groupName: groupName,
                role: 'owner',
                joinedAt: serverTimestamp()
            });

            // 3. Update User Profile if needed
            // await setDoc(doc(db, 'users', user.uid), { groupId: groupId }, { merge: true }); // No longer needed for logic, but maybe for legacy?

            toast.success(t('groups.createTitle'));
            setNewGroupName('');
            // Switch to new group automatically?
            switchGroup(groupId);
        } catch (error) {
            console.error(error);
            toast.error(t('groups.errors.createFailed'));
        } finally {
            setLoading(false);
        }
    };

    const joinGroup = async () => {
        if (!user || !joinCode) return;
        setLoading(true);

        try {
            const q = query(collection(db, 'groups'), where('inviteCode', '==', joinCode.toUpperCase().trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error(t('groups.errors.invalidCode'));
                setLoading(false);
                return;
            }

            const groupDoc = querySnapshot.docs[0];
            const groupData = groupDoc.data();
            const groupId = groupDoc.id;

            if (groupData.memberIds.includes(user.uid)) {
                toast.error(t('groups.errors.alreadyMember'));
                setLoading(false);
                return;
            }

            // 1. Update Group
            await updateDoc(doc(db, 'groups', groupId), {
                memberIds: arrayUnion(user.uid),
                [`members.${user.uid}`]: { role: 'editor', joinedAt: serverTimestamp() }
            });

            // 2. Create Membership Doc
            await setDoc(doc(db, 'users', user.uid, 'memberships', groupId), {
                groupId: groupId,
                groupName: groupData.name || t('groups.defaultGroupName'),
                role: 'editor',
                joinedAt: serverTimestamp()
            });

            toast.success(t('groups.joinSuccess'));
            setJoinCode('');
            switchGroup(groupId);
        } catch (error) {
            console.error(error);
            toast.error(t('groups.errors.joinFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleRename = async (groupId: string) => {
        if (!editName.trim()) return;
        setLoading(true);
        try {
            // Update Group Doc
            await updateDoc(doc(db, 'groups', groupId), { name: editName.trim() });

            // Update My Membership (Others updated via self-healing)
            if (user) {
                await updateDoc(doc(db, 'users', user.uid, 'memberships', groupId), { groupName: editName.trim() });
            }

            setEditingGroupId(null);
            setEditName('');
            toast.success(t('common.saved') || "Saved");
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const initiateRename = (groupId: string, currentName: string) => {
        setEditingGroupId(groupId);
        setEditName(currentName);
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm(t('groups.confirmDelete') || "Are you sure you want to delete this group? All apartments will be moved to trash.")) return;
        setLoading(true);
        try {
            // 1. Soft Delete Group
            await updateDoc(doc(db, 'groups', groupId), { deleted: true });

            // 2. Cascade Soft Delete to Apartments
            // Note: This requires querying. For large collections, this should be a backend function.
            // Client-side loop for now (limit 500?)
            const aptQuery = query(collection(db, 'apartments'), where('groupId', '==', groupId));
            const aptSnaps = await getDocs(aptQuery);

            const batch = writeBatch(db);
            aptSnaps.forEach(doc => {
                batch.update(doc.ref, { deleted: true });
            });
            await batch.commit();

            // 3. Remove Membership for current user (or all?)
            // We can't remove for all easily. Just remove for self.
            if (user) {
                await deleteDoc(doc(db, 'users', user.uid, 'memberships', groupId));
                if (activeGroup?.id === groupId) switchGroup(null);
            }

            toast.success(t('groups.deleted') || "Group deleted");
        } catch (error) {
            console.error("Delete failed", error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (activeGroup?.inviteCode) {
            navigator.clipboard.writeText(activeGroup.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success(t('groups.copied'));
        }
    };

    const leaveGroup = async () => {
        if (!user || !activeGroup) return;

        try {
            const updatedMemberIds = activeGroup.memberIds.filter(id => id !== user.uid);
            await updateDoc(doc(db, 'groups', activeGroup.id), {
                memberIds: updatedMemberIds,
                [`members.${user.uid}`]: deleteField()
            });

            await deleteDoc(doc(db, 'users', user.uid, 'memberships', activeGroup.id));

            if (defaultGroupId === activeGroup.id) {
                await setDefaultGroup(null);
            }

            setIsLeaveModalOpen(false);
            switchGroup(null);
            toast.success(t('groups.leaveSuccess'));
        } catch (error) {
            console.error(error);
        }
    };

    const removeMember = async (memberId: string) => {
        if (!activeGroup || !user) return;
        if (!confirm(t('groups.confirmRemoveMember'))) return;

        try {
            await updateDoc(doc(db, 'groups', activeGroup.id), {
                memberIds: arrayRemove(memberId),
                [`members.${memberId}`]: deleteField()
            });
            toast.success(t('groups.memberRemoved'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    return (
        <div className="p-4 pb-20">
            <h1 className="text-2xl font-bold mb-6 text-center">{t('groups.title')}</h1>

            {/* Group Switcher / List */}
            {myGroups.length > 0 && (
                <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border">
                    <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Briefcase size={20} />
                        {t('agentMode.manage')}
                    </h2>
                    <div className="space-y-2">
                        {/* Personal Workspace Option */}
                        <div className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${!activeGroup
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-gray-50 hover:bg-gray-100'
                            }`}>
                            <button
                                onClick={() => switchGroup(null)}
                                className="flex-1 text-left flex items-center gap-2"
                            >
                                <span className="font-medium">{t('agentMode.personalWorkspace') || "My Private Workspace"}</span>
                                {loading && !activeGroup && <span className="text-xs animate-pulse">...</span>}
                            </button>
                            <div className="flex items-center gap-2">
                                {!activeGroup && <Check size={16} className="text-blue-600" />}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDefaultGroup(null); }}
                                    className={`p-1 rounded-full hover:bg-gray-200 ${defaultGroupId === null ? 'text-yellow-500' : 'text-gray-300'}`}
                                    title={t('groups.setDefault') || "Set as Default"}
                                >
                                    <Star size={16} fill={defaultGroupId === null ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>

                        {myGroups.map(bg => (
                            <div key={bg.groupId} className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${activeGroup?.id === bg.groupId
                                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                : 'bg-gray-50 hover:bg-gray-100'
                                }`}>

                                {editingGroupId === bg.groupId ? (
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 px-2 py-1 text-sm border rounded bg-white"
                                            autoFocus
                                        />
                                        <button onClick={() => handleRename(bg.groupId)} className="text-green-600 p-1"><Check size={16} /></button>
                                        <button onClick={() => setEditingGroupId(null)} className="text-gray-400 p-1"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => switchGroup(bg.groupId)}
                                        className="flex-1 text-left"
                                    >
                                        <span className="font-medium">
                                            {bg.groupName || t('groups.defaultGroupName')}
                                        </span>
                                    </button>
                                )}

                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {activeGroup?.id === bg.groupId && !editingGroupId && <Check size={16} className="text-blue-600 mr-2" />}

                                    {!editingGroupId && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDefaultGroup(bg.groupId); }}
                                                className={`p-1 rounded-full hover:bg-gray-200 ${defaultGroupId === bg.groupId ? 'text-yellow-500' : 'text-gray-300'}`}
                                                title={t('groups.setDefault')}
                                            >
                                                <Star size={16} fill={defaultGroupId === bg.groupId ? "currentColor" : "none"} />
                                            </button>

                                            {bg.role === 'owner' && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); initiateRename(bg.groupId, bg.groupName || ''); }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 rounded-full"
                                                        title={t('common.edit') || "Rename"}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(bg.groupId); }}
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-200 rounded-full"
                                                        title={t('common.delete') || "Delete"}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeGroup ? (
                // Active Group View (Details, Code, Members)
                <div className="bg-white rounded-xl shadow-sm border p-6 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{activeGroup.name || t('groups.yourGroup')}</h2>
                    <div className="text-gray-500 mb-6">
                        <p className="mb-2">{t('groups.members')}: {activeGroup.memberIds.length}</p>
                        <div className="flex flex-col gap-2">
                            {members.map(member => (
                                <div key={member.uid} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                                        {member.displayName?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="text-sm flex-grow text-right">
                                        <p className="font-medium text-gray-900">
                                            {member.displayName || member.email?.split('@')[0] || t('groups.anonymous')}
                                        </p>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                    {member.uid === user?.uid ? (
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            {t('groups.you')}
                                        </span>
                                    ) : (activeGroup.createdBy === user?.uid) && (
                                        <button
                                            onClick={() => removeMember(member.uid)}
                                            className="text-red-500 p-1 hover:bg-red-50 rounded"
                                            title={t('groups.removeMember')}
                                        >
                                            <LogOut size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 mb-6">
                        <p className="text-sm text-gray-500 mb-1">{t('groups.inviteCode')}</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-mono font-bold tracking-wider text-gray-800">
                                {activeGroup.inviteCode}
                            </span>
                            <button onClick={copyCode} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsLeaveModalOpen(true)}
                        className="text-red-500 text-sm hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <LogOut size={16} />
                        {t('groups.leave')}
                    </button>
                </div>
            ) : (
                // No Active Group -> Show Join/Create Options
                <div className="grid gap-6">
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

                    <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
                        <h2 className="font-bold text-lg mb-2 text-gray-800">{t('groups.createTitle')}</h2>
                        <p className="text-gray-500 text-sm mb-4">{t('groups.createSubtitle')}</p>

                        <div className="mb-4">
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder={t('groups.groupNamePlaceholder') || "Group Name (e.g. Cohen Family)"}
                                className="w-full p-3 border rounded-xl text-center"
                            />
                        </div>

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
            )}

            <div className="mt-8 text-center">
                <Link to="/" className="text-blue-600 font-medium flex items-center justify-center gap-1 hover:underline">
                    {t('groups.backToApartments')} {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </Link>
            </div>

            {/* Custom Leave Modal */}
            {isLeaveModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsLeaveModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('groups.leaveModal.title')}</h3>
                            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                {t('groups.leaveModal.body')}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsLeaveModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    {t('groups.leaveModal.cancel')}
                                </button>
                                <button
                                    onClick={leaveGroup}
                                    className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    {t('groups.leaveModal.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

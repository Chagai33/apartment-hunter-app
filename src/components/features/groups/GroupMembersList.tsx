
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { db } from '../../../lib/firebase';
import {
    collection,
    doc,
    updateDoc,
    arrayRemove,
    query,
    where,
    onSnapshot,
    documentId
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Users, Copy, Check, LogOut } from 'lucide-react';

interface GroupMembersListProps {
    group: any; // Using any for now to avoid strict typing issues during refactor, but ideally Group type
}

export function GroupMembersList({ group }: GroupMembersListProps) {
    const { user } = useAuth();
    const { selectGroup } = useGroup(); // Needed for leaving group
    const { t } = useTranslation();

    // UI State
    const [copied, setCopied] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [members, setMembers] = useState<any[]>([]);

    // Fetch members details
    useEffect(() => {
        if (group?.members?.length) {
            const memberIdsToCheck = group.members.slice(0, 10);

            if (memberIdsToCheck.length > 0) {
                const q = query(collection(db, 'users'), where(documentId(), 'in', memberIdsToCheck));
                const unsub = onSnapshot(q, (snapshot) => {
                    const membersData = snapshot.docs.map(d => ({ ...d.data(), uid: d.id }));
                    setMembers(membersData);
                }, (err) => console.error("Error fetching members:", err));
                return () => unsub();
            }
        } else {
            setMembers([]);
        }
    }, [group?.members]);

    const copyCode = () => {
        // @ts-ignore
        if (group?.inviteCode) {
            // @ts-ignore
            navigator.clipboard.writeText(group.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success(t('groups.copied'));
        }
    };

    const leaveGroup = async () => {
        if (!user || !group) return;

        try {
            await updateDoc(doc(db, 'groups', group.id), {
                members: arrayRemove(user.uid)
            });

            setIsLeaveModalOpen(false);
            selectGroup(null); // Switch to personal
            toast.success(t('groups.leaveSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const removeMember = async (memberId: string) => {
        if (!group || !user) return;
        if (!confirm(t('groups.confirmRemoveMember'))) return;

        try {
            await updateDoc(doc(db, 'groups', group.id), {
                members: arrayRemove(memberId)
            });
            toast.success(t('groups.memberRemoved'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    return (
        <div className="p-4">
            <div className="bg-white rounded-xl text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{group.name || t('groups.yourGroup')}</h2>
                <div className="text-gray-500 mb-6">
                    <p className="mb-2">{t('groups.members')}: {group.members?.length || 0}</p>

                    {/* Members List */}
                    <div className="flex flex-col gap-2 max-w-sm mx-auto">
                        {members.map(member => (
                            <div key={member.uid} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg text-left">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                                    {member.displayName?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="text-sm flex-grow overflow-hidden">
                                    <p className="font-medium text-gray-900 truncate">
                                        {member.displayName || member.email?.split('@')[0] || t('groups.anonymous')}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                </div>

                                {member.uid === user?.uid ? (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                                        {t('groups.you')}
                                    </span>
                                ) : (group.createdBy === user?.uid) && (
                                    <button
                                        onClick={() => removeMember(member.uid)}
                                        className="text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors shrink-0"
                                        title={t('groups.removeMember')}
                                    >
                                        <LogOut size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Invite Code Section */}
                {/* @ts-ignore */}
                {group.inviteCode && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 max-w-sm mx-auto">
                        <p className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wider">{t('groups.inviteCode')}</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-mono font-bold tracking-wider text-gray-800">
                                {/* @ts-ignore */}
                                {group.inviteCode}
                            </span>
                            <button
                                onClick={copyCode}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title={t('groups.copyCode')}
                            >
                                {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t('groups.shareCode')}</p>
                    </div>
                )}

                <button
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="text-red-500 text-sm hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    <LogOut size={16} />
                    {t('groups.leave')}
                </button>
            </div>

            {/* Leave Modal */}
            {isLeaveModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsLeaveModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
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

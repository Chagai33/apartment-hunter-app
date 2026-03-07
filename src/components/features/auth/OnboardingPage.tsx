import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, Users, KeyRound, ArrowRight, ArrowLeft, Check, Copy } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Input } from '../../common/Input';

export function OnboardingPage() {
    const { user } = useAuth();
    const { createGroup, selectGroup } = useGroup();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<'alone' | 'partner' | 'join' | null>(null);

    // Form States
    const [groupName, setGroupName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const isRtl = i18n.dir() === 'rtl';

    const handleAlone = async () => {
        setLoading(true);
        try {
            await createGroup(t('onboarding.defaultGroupName', 'החיפוש שלי'), true);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(t('onboarding.errorCreate'));
        } finally {
            setLoading(false);
        }
    };

    const handlePartnerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim()) {
            toast.error(t('groups.errors.missingName'));
            return;
        }

        setLoading(true);
        try {
            const { inviteCode } = await createGroup(groupName.trim(), false);
            setCreatedInviteCode(inviteCode);
        } catch (error) {
            console.error(error);
            toast.error(t('onboarding.errorCreate'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!createdInviteCode) return;
        try {
            await navigator.clipboard.writeText(createdInviteCode);
            setCopied(true);
            toast.success(t('onboarding.codeCopied', 'הקוד הועתק!'));
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !joinCode.trim()) return;
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

            if (groupData.members && groupData.members.includes(user.uid)) {
                toast.error(t('groups.errors.alreadyMember'));
                setLoading(false);
                return;
            }

            await updateDoc(doc(db, 'groups', groupId), {
                members: arrayUnion(user.uid)
            });

            toast.success(t('groups.joinSuccess'));
            selectGroup(groupId);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(t('groups.errors.joinFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
                        {t('onboarding.welcome')}
                    </h1>
                    <p className="text-gray-500 text-lg">
                        {t('onboarding.subtitle')}
                    </p>
                </div>

                {!selectedOption ? (
                    <div className="space-y-4">
                        <button
                            onClick={() => setSelectedOption('alone')}
                            className="w-full flex items-center p-5 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-right"
                        >
                            <div className="bg-blue-100 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg">{t('onboarding.optionAloneTitle')}</h3>
                                <p className="text-gray-500 text-sm">{t('onboarding.optionAloneDesc')}</p>
                            </div>
                            {isRtl ? <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-500" /> : <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />}
                        </button>

                        <button
                            onClick={() => setSelectedOption('partner')}
                            className="w-full flex items-center p-5 rounded-2xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all group text-right"
                        >
                            <div className="bg-purple-100 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg">{t('onboarding.optionPartnerTitle')}</h3>
                                <p className="text-gray-500 text-sm">{t('onboarding.optionPartnerDesc')}</p>
                            </div>
                            {isRtl ? <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-purple-500" /> : <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />}
                        </button>

                        <button
                            onClick={() => setSelectedOption('join')}
                            className="w-full flex items-center p-5 rounded-2xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group text-right"
                        >
                            <div className="bg-green-100 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                                <KeyRound className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg">{t('onboarding.optionJoinTitle')}</h3>
                                <p className="text-gray-500 text-sm">{t('onboarding.optionJoinDesc')}</p>
                            </div>
                            {isRtl ? <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-green-500" /> : <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500" />}
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {selectedOption === 'alone' && (
                            <div className="text-center py-6">
                                <p className="text-lg text-gray-700 mb-6">{t('onboarding.confirmAlone')}</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedOption(null)}
                                        disabled={loading}
                                        className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleAlone}
                                        disabled={loading}
                                        className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                    >
                                        {loading ? t('common.loading') : t('onboarding.start')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedOption === 'partner' && (
                            createdInviteCode ? (
                                <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-4">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('onboarding.groupCreatedTitle', 'הקבוצה נוצרה בהצלחה! 🎉')}</h2>
                                    <p className="text-gray-600 mb-6">{t('onboarding.shareCodeDesc', 'שתפו את הקוד הזה עם השותף/ה שלכם כדי שיצטרפו לחיפוש:')}</p>

                                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-purple-200 mb-6 relative group">
                                        <div className="text-4xl font-mono tracking-[0.25em] font-bold text-gray-900 mb-2">
                                            {createdInviteCode}
                                        </div>
                                        <button
                                            onClick={handleCopyCode}
                                            className="mx-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-purple-300 transition-all shadow-sm"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            {copied ? t('onboarding.codeCopied', 'הקוד הועתק!') : t('onboarding.copyCode', 'העתק קוד')}
                                        </button>
                                    </div>

                                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm text-right mb-8">
                                        <p className="font-semibold mb-1">💡 האם השותף צריך לפתוח חשבון?</p>
                                        <p>{t('onboarding.partnerInstructions', 'הם יצטרכו להירשם לאפליקציה ולבחור במסך זה באפשרות "יש לי קוד הזמנה".')}</p>
                                        <p className="mt-2 text-blue-600 font-medium text-xs">{t('onboarding.shareLaterNote', 'אל דאגה, תוכלו למצוא ולשתף את הקוד הזה תמיד גם במסך "ניהול שותפים".')}</p>
                                    </div>

                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-4 px-6 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors shadow-lg"
                                    >
                                        {t('onboarding.continueToDashboard', 'המשך ללוח הדירות')}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handlePartnerSubmit} className="space-y-6">
                                    <Input
                                        label={t('onboarding.groupNameLabel')}
                                        placeholder={t('onboarding.groupNamePlaceholder', 'לדוגמה: הדירות של דני ודנה')}
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOption(null)}
                                            disabled={loading}
                                            className="w-1/3 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-2/3 py-3 px-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                        >
                                            {loading ? t('common.loading') : t('onboarding.createAndStart')}
                                        </button>
                                    </div>
                                </form>
                            )
                        )}

                        {selectedOption === 'join' && (
                            <form onSubmit={handleJoinSubmit} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">{t('groups.inviteCode')}</label>
                                    <input
                                        type="text"
                                        placeholder="ABCDEF"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        maxLength={6}
                                        required
                                        autoFocus
                                        dir="ltr"
                                        className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none uppercase transition-all"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOption(null)}
                                        disabled={loading}
                                        className="w-1/3 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || joinCode.length < 5}
                                        className="w-2/3 py-3 px-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50"
                                    >
                                        {loading ? t('common.loading') : t('groups.join')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

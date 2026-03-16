import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Apartment, UserPreferences, CustomChecklistTemplate } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { useTranslation } from 'react-i18next';
import { Edit, Phone, MapPin, ExternalLink, Check, Eye, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, MessageSquare, Trash2, FileSignature, X, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export function ApartmentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { activeGroupId, groups } = useGroup();
    const { t } = useTranslation();
    const [apartment, setApartment] = useState<Apartment | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [isEditingReqs, setIsEditingReqs] = useState(false);
    const [activeNoteField, setActiveNoteField] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const isMounted = useRef(true);

    const [checklistTemplates, setChecklistTemplates] = useState<CustomChecklistTemplate[]>([]);

    // Inline Add Question State
    const [addingQuestionPhase, setAddingQuestionPhase] = useState<string | null>(null);
    const [newQuestionText, setNewQuestionText] = useState('');

    // Tab State
    const [activeTab, setActiveTab] = useState<'phone' | 'visit' | 'signing'>('phone');

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        isMounted.current = true;

        const timeoutId = setTimeout(() => {
            if (isMounted.current && loading) {
                setLoading(false);
                toast.error(t('apartment.loadingLong'));
            }
        }, 10000);

        const unsubApartment = onSnapshot(doc(db, 'apartments', id), (docSnap) => {
            clearTimeout(timeoutId);
            if (isMounted.current) {
                if (docSnap.exists()) {
                    setApartment({ id: docSnap.id, ...docSnap.data() } as Apartment);
                    setLoading(false);
                } else {
                    toast.error(t('apartment.notFound'));
                    navigate('/');
                }
            }
        }, (error) => {
            clearTimeout(timeoutId);
            console.error("Error fetching apartment:", error);
            if (isMounted.current) {
                toast.error(t('common.error'));
                setLoading(false);
            }
        });

        // Context-Aware Preferences & Checklists Loading
        let unsubUser = () => { };

        if (activeGroupId) {
            // Group Mode: Load directly from the active group object in context (optimised)
            // Or set up a listener if we want real-time updates to group settings.
            // Since 'groups' from context updates on change, we can just derive it.
            const currentGroup = groups.find(g => g.id === activeGroupId);
            if (currentGroup) {
                if (currentGroup.preferences) setPreferences(currentGroup.preferences);
                else setPreferences(null);

                if (currentGroup.checklistTemplates) setChecklistTemplates(currentGroup.checklistTemplates);
                else setChecklistTemplates([]);
            }
        } else {
            // Personal Mode: Listen to User Doc
            if (user) {
                unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                    if (isMounted.current && docSnap.exists()) {
                        const userData = docSnap.data();
                        if (userData.preferences) {
                            setPreferences(userData.preferences);
                        } else {
                            setPreferences(null);
                        }

                        if (userData.checklistTemplates) {
                            setChecklistTemplates(userData.checklistTemplates);
                        } else {
                            setChecklistTemplates([]);
                        }
                    }
                });
            }
        }

        return () => {
            isMounted.current = false;
            clearTimeout(timeoutId);
            unsubApartment();
            unsubUser();
        };
    }, [id, navigate, user, t, activeGroupId, groups]);

    const setFieldValue = async (field: keyof Apartment, value: boolean | null) => {
        if (!apartment || !id) return;

        try {
            await updateDoc(doc(db, 'apartments', id), { [field]: value });
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const setCustomCheckValue = async (templateId: string, value: boolean | null) => {
        if (!apartment || !id) return;

        try {
            const updatedChecks = {
                ...(apartment.customChecks || {}),
                [templateId]: value
            };
            await updateDoc(doc(db, 'apartments', id), { customChecks: updatedChecks });
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const handleDelete = async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        if (!apartment || !id) return;

        try {
            await updateDoc(doc(db, 'apartments', id), {
                deleted: true,
                deletedAt: serverTimestamp()
            });
            toast.success(t('common.deleteSuccess'));
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const renderCustomItem = (template: CustomChecklistTemplate) => {
        const hasNote = apartment?.checklistNotes?.[template.id];
        const isEditingNote = activeNoteField === template.id;

        return (
            <div key={template.id} className="mb-2">
                <div className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg transition-colors border-r-2 border-blue-200">
                    {/* Note Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isEditingNote) {
                                setActiveNoteField(null);
                            } else {
                                setActiveNoteField(template.id);
                                setNoteText(hasNote || '');
                            }
                        }}
                        className={clsx("p-2 rounded-full", hasNote ? "text-blue-600 bg-blue-50" : "text-gray-300 hover:text-gray-500")}
                    >
                        <MessageSquare size={16} />
                    </button>

                    {/* Label */}
                    <div className="flex-1 text-right mr-3">
                        <span className="text-gray-700 font-medium text-sm">{template.label}</span>
                        {hasNote && !isEditingNote && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{hasNote}</div>
                        )}
                    </div>

                    {/* 3-State Buttons */}
                    <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                        <button
                            type="button"
                            onClick={() => setCustomCheckValue(template.id, true)}
                            className={clsx(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                apartment?.customChecks?.[template.id] === true ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {t('common.yes', 'יש')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCustomCheckValue(template.id, null)}
                            className={clsx(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                apartment?.customChecks?.[template.id] == null ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {t('common.doesntMatter', '—')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCustomCheckValue(template.id, false)}
                            className={clsx(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                apartment?.customChecks?.[template.id] === false ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {t('common.no', 'אין')}
                        </button>
                    </div>
                </div>

                {/* Note Edit Input */}
                {isEditingNote && (
                    <div className="mr-8 ml-2 mt-1 flex gap-2">
                        <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder={t('apartment.addNotePlaceholder')}
                            autoFocus
                        />
                        <button
                            onClick={() => saveNote(template.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const saveNote = async (field: string) => {
        if (!apartment || !id) return;

        // Optimistic close
        setActiveNoteField(null);

        try {
            const updatedNotes = {
                ...(apartment.checklistNotes || {}),
                [field]: noteText
            };
            await updateDoc(doc(db, 'apartments', id), { checklistNotes: updatedNotes });
            setNoteText('');
        } catch (error) {
            console.error(error);
            toast.error(t('apartment.saveNoteError'));
        }
    };

    const handleAddTemplate = async (phase: string) => {
        if (!newQuestionText.trim()) return;
        if (!user) return;

        const newTemplate: CustomChecklistTemplate = {
            id: Date.now().toString(),
            label: newQuestionText,
            phase: phase as any
        };

        const updatedTemplates = [...checklistTemplates, newTemplate];

        try {
            let docRef;
            if (activeGroupId) {
                docRef = doc(db, 'groups', activeGroupId);
            } else {
                docRef = doc(db, 'users', user.uid);
            }

            await updateDoc(docRef, {
                checklistTemplates: updatedTemplates
            });

            toast.success(t('settings.saveSuccess'));
            setNewQuestionText('');
            setAddingQuestionPhase(null);
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const renderAddQuestion = (phase: string) => {
        const isAdding = addingQuestionPhase === phase;

        if (isAdding) {
            return (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder={t('settings.newQuestionPlaceholder') || "הקלד שאלה חדשה..."}
                        className="w-full border rounded px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTemplate(phase);
                            if (e.key === 'Escape') setAddingQuestionPhase(null);
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setAddingQuestionPhase(null)}
                            className="text-gray-500 text-xs px-3 py-1 hover:bg-gray-200 rounded"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={() => handleAddTemplate(phase)}
                            disabled={!newQuestionText.trim()}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded font-bold disabled:opacity-50"
                        >
                            {t('common.add')}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <button
                onClick={() => {
                    setAddingQuestionPhase(phase);
                    setNewQuestionText('');
                }}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2 px-2 transition-colors w-full justify-start py-2 hover:bg-blue-50 rounded-lg group"
            >
                <Plus size={16} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">{t('apartment.addQuestion', 'Add Question')}</span>
            </button>
        );
    };

    const getMissingRequirements = () => {
        if (!preferences || !apartment) return [];
        const missing: string[] = [];

        if (preferences.mustHaveElevator && !apartment.elevator) missing.push(t('apartment.elevator'));
        if (preferences.mustHaveParking && !apartment.parking) missing.push(t('apartment.parking'));
        if (preferences.mustHaveBalcony && !apartment.balcony) missing.push(t('apartment.balcony'));
        if (preferences.mustHaveAC && !apartment.ac) missing.push(t('apartment.ac'));

        if (preferences.acceptedShelters && preferences.acceptedShelters.length > 0) {
            const hasAcceptedShelter = preferences.acceptedShelters.some(shelterType => {
                if (shelterType === 'ממ״ד / תמ״א 38') return apartment.tama38 === true;
                return apartment.inferredCustomChecks?.[shelterType] === true;
            });
            if (!hasAcceptedShelter) missing.push(t('apartment.shelter', 'מיגון'));
        }

        if (preferences.mustHavePets && !apartment.pets) missing.push(t('apartment.pets'));
        if (preferences.mustHaveFurnished && !apartment.furnished) missing.push(t('apartment.furnished'));

        if (preferences.maxPrice && apartment.price > preferences.maxPrice) missing.push(`${t('settings.maxPrice')} (${preferences.maxPrice} ₪)`);
        if (preferences.minRooms && (apartment.rooms || 0) < preferences.minRooms) missing.push(`${t('settings.minRooms')} (${preferences.minRooms})`);

        // Custom Requirements Check
        if (preferences.customMustHaves) {
            preferences.customMustHaves.forEach(templateId => {
                const template = checklistTemplates.find(t => t.id === templateId);
                // If template exists and check is false/undefined, it's missing
                if (template && !apartment.customChecks?.[templateId]) {
                    missing.push(template.label);
                }
            });
        }

        return missing;
    };

    if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;
    if (!apartment) return null;

    const missingReqs = getMissingRequirements();
    const isMatch = missingReqs.length === 0;

    const renderBooleanItem = (field: keyof Apartment, label: string) => {
        const hasNote = apartment.checklistNotes?.[field];
        const isEditingNote = activeNoteField === field;

        return (
            <div className="mb-2">
                <div className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    {/* Note Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isEditingNote) {
                                setActiveNoteField(null);
                            } else {
                                setActiveNoteField(field);
                                setNoteText(hasNote || '');
                            }
                        }}
                        className={clsx("p-2 rounded-full", hasNote ? "text-blue-600 bg-blue-50" : "text-gray-300 hover:text-gray-500")}
                    >
                        <MessageSquare size={16} />
                    </button>

                    {/* Label */}
                    <div className="flex-1 text-right mr-3">
                        <span className="text-gray-700 font-medium text-sm">{label}</span>
                        {hasNote && !isEditingNote && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{hasNote}</div>
                        )}
                    </div>

                    {/* 3-State Buttons */}
                    <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                        <button
                            type="button"
                            onClick={() => setFieldValue(field, true)}
                            className={clsx(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                apartment[field] === true ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {t('common.yes', 'יש')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFieldValue(field, null)}
                            className={clsx(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                apartment[field] == null ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {t('common.doesntMatter', '—')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFieldValue(field, false)}
                            className={clsx(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                apartment[field] === false ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {t('common.no', 'אין')}
                        </button>
                    </div>
                </div>

                {/* Note Edit Input */}
                {isEditingNote && (
                    <div className="mr-8 ml-2 mt-1 flex gap-2">
                        <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder={t('apartment.addNotePlaceholder')}
                            autoFocus
                        />
                        <button
                            onClick={() => saveNote(field)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Summary Generator
    const generateSummary = () => {
        const positiveFields: string[] = [];
        const booleanFields: { key: keyof Apartment, label: string }[] = [
            { key: 'elevator', label: t('apartment.elevator') },
            { key: 'parking', label: t('apartment.parking') },
            { key: 'balcony', label: t('apartment.balcony') },
            { key: 'pets', label: t('apartment.pets') },
            { key: 'furnished', label: t('apartment.furnished') },
            { key: 'tama38', label: t('apartment.tama38') },
            { key: 'ac', label: t('apartment.ac') },
            { key: 'bars', label: t('apartment.bars') },
            { key: 'doubleGlazed', label: t('apartment.doubleGlazed') },
            { key: 'naturalLight', label: t('apartment.naturalLight') },
        ];

        booleanFields.forEach(({ key, label }) => {
            if (apartment[key]) {
                const note = apartment.checklistNotes?.[key];
                positiveFields.push(`${label}${note ? ` (${note})` : ''}`);
            }
        });

        return positiveFields;
    };

    const QuickEditRequirements = ({ onClose }: { onClose: () => void }) => {
        const [tempPrefs, setTempPrefs] = useState<UserPreferences>(preferences || {});
        const [newCustomReq, setNewCustomReq] = useState('');

        const toggle = (key: keyof UserPreferences) => {
            setTempPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        };

        const toggleCustom = (templateId: string) => {
            setTempPrefs(prev => {
                const current = prev.customMustHaves || [];
                const exists = current.includes(templateId);
                return {
                    ...prev,
                    customMustHaves: exists
                        ? current.filter(id => id !== templateId)
                        : [...current, templateId]
                };
            });
        };

        const addNewRequirement = async () => {
            if (!newCustomReq.trim() || !user) return;

            // 1. Create new template
            const newTemplate: CustomChecklistTemplate = {
                id: Date.now().toString(),
                label: newCustomReq,
                phase: 'visit' // Default to visit for general requirements
            };

            const updatedTemplates = [...checklistTemplates, newTemplate];

            try {
                // 2. Save template to Firestore (User or Group)
                const targetRef = activeGroupId
                    ? doc(db, 'groups', activeGroupId)
                    : doc(db, 'users', user.uid);

                await updateDoc(targetRef, {
                    checklistTemplates: updatedTemplates
                });

                // 3. Add to local tempPrefs immediately
                toggleCustom(newTemplate.id);
                setNewCustomReq('');
                toast.success(t('apartment.reqAdded'));
            } catch (error) {
                console.error(error);
                toast.error(t('common.error'));
            }
        };

        const save = async () => {
            if (!user) return;
            try {
                const targetRef = activeGroupId
                    ? doc(db, 'groups', activeGroupId)
                    : doc(db, 'users', user.uid);

                await updateDoc(targetRef, { preferences: tempPrefs });
                toast.success(t('settings.saveSuccess'));
                onClose();
            } catch (error) {
                console.error(error);
                toast.error(t('common.error'));
            }
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-lg">{t('settings.editMustHaves') || 'עריכת דרישות חובה'}</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto">
                        <label className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                            <span className="font-medium text-gray-700">{t('apartment.elevator')}</span>
                            <div className={clsx("w-12 h-7 rounded-full p-1 transition-colors duration-200", tempPrefs.mustHaveElevator ? "bg-blue-600" : "bg-gray-200")}>
                                <div className={clsx("w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200", tempPrefs.mustHaveElevator ? "translate-x-[-1.25rem]" : "translate-x-0")} />
                            </div>
                            <input type="checkbox" className="hidden" checked={tempPrefs.mustHaveElevator || false} onChange={() => toggle('mustHaveElevator')} />
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                            <span className="font-medium text-gray-700">{t('apartment.parking')}</span>
                            <div className={clsx("w-12 h-7 rounded-full p-1 transition-colors duration-200", tempPrefs.mustHaveParking ? "bg-blue-600" : "bg-gray-200")}>
                                <div className={clsx("w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200", tempPrefs.mustHaveParking ? "translate-x-[-1.25rem]" : "translate-x-0")} />
                            </div>
                            <input type="checkbox" className="hidden" checked={tempPrefs.mustHaveParking || false} onChange={() => toggle('mustHaveParking')} />
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                            <span className="font-medium text-gray-700">{t('apartment.balcony')}</span>
                            <div className={clsx("w-12 h-7 rounded-full p-1 transition-colors duration-200", tempPrefs.mustHaveBalcony ? "bg-blue-600" : "bg-gray-200")}>
                                <div className={clsx("w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200", tempPrefs.mustHaveBalcony ? "translate-x-[-1.25rem]" : "translate-x-0")} />
                            </div>
                            <input type="checkbox" className="hidden" checked={tempPrefs.mustHaveBalcony || false} onChange={() => toggle('mustHaveBalcony')} />
                        </label>

                        <label className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                            <span className="font-medium text-gray-700">{t('apartment.ac')}</span>
                            <div className={clsx("w-12 h-7 rounded-full p-1 transition-colors duration-200", tempPrefs.mustHaveAC ? "bg-blue-600" : "bg-gray-200")}>
                                <div className={clsx("w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200", tempPrefs.mustHaveAC ? "translate-x-[-1.25rem]" : "translate-x-0")} />
                            </div>
                            <input type="checkbox" className="hidden" checked={tempPrefs.mustHaveAC || false} onChange={() => toggle('mustHaveAC')} />
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                            <span className="font-medium text-gray-700">{t('apartment.pets')}</span>
                            <div className={clsx("w-12 h-7 rounded-full p-1 transition-colors duration-200", tempPrefs.mustHavePets ? "bg-blue-600" : "bg-gray-200")}>
                                <div className={clsx("w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200", tempPrefs.mustHavePets ? "translate-x-[-1.25rem]" : "translate-x-0")} />
                            </div>
                            <input type="checkbox" className="hidden" checked={tempPrefs.mustHavePets || false} onChange={() => toggle('mustHavePets')} />
                        </label>

                        {/* Custom Requirements Section */}
                        {checklistTemplates.length > 0 && (
                            <div className="pt-2 border-t mt-4">
                                <h4 className="text-sm font-bold text-gray-500 mb-2">{t('settings.customRequirements') || "דרישות נוספות"}</h4>
                                {checklistTemplates.map(template => (
                                    <label key={template.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer mb-2">
                                        <span className="font-medium text-gray-700">{template.label}</span>
                                        <div className={clsx("w-12 h-7 rounded-full p-1 transition-colors duration-200", tempPrefs.customMustHaves?.includes(template.id) ? "bg-blue-600" : "bg-gray-200")}>
                                            <div className={clsx("w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200", tempPrefs.customMustHaves?.includes(template.id) ? "translate-x-[-1.25rem]" : "translate-x-0")} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={tempPrefs.customMustHaves?.includes(template.id) || false}
                                            onChange={() => toggleCustom(template.id)}
                                        />
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Add New Requirement */}
                        <div className="pt-2 border-t mt-2">
                            <h4 className="text-sm font-bold text-gray-500 mb-2">{t('settings.addNewRequirement') || "הוסף דרישה חדשה"}</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCustomReq}
                                    onChange={(e) => setNewCustomReq(e.target.value)}
                                    placeholder={t('settings.reqPlaceholder') || "למשל: חניה מקורה..."}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                    onKeyDown={e => e.key === 'Enter' && addNewRequirement()}
                                />
                                <button
                                    onClick={addNewRequirement}
                                    disabled={!newCustomReq.trim()}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t bg-gray-50 shrink-0">
                        <button onClick={save} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
                            {t('common.saveChanges')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-20">
            {/* Image Gallery */}
            {apartment.images && apartment.images.length > 0 && (
                <div className="w-full h-64 bg-gray-100 relative">
                    {apartment.images.length === 1 ? (
                        <img src={apartment.images[0].url} alt={apartment.address} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex overflow-x-auto snap-x snap-mandatory h-full hide-scrollbar">
                            {apartment.images.map((img, index) => (
                                <div key={img.path || index} className="w-full h-full flex-shrink-0 snap-center relative">
                                    <img src={img.url} alt={`${apartment.address} - ${index + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm backdrop-blur-sm">
                                        {index + 1} / {apartment.images?.length}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Header / Hero */}
            <div className="bg-white p-4 border-b">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-xl font-bold text-gray-900">{apartment.address}</h1>
                    <Link to={`/edit/${id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                        <Edit size={20} />
                    </Link>
                    <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                        <Trash2 size={20} />
                    </button>
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin size={16} className="ml-1" />
                    {apartment.neighborhood}
                </div>

                {/* Status Selector */}
                <div className="mb-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">{t('apartment.statusLabel', 'Status')}</label>
                    <div className="relative">
                        <select
                            value={apartment.status}
                            onChange={async (e) => {
                                if (!apartment || !id) return;
                                try {
                                    await updateDoc(doc(db, 'apartments', id), {
                                        status: e.target.value,
                                        lastUpdatedBy: user?.uid,
                                        lastUpdatedByName: user?.displayName || user?.email || 'Unknown',
                                        updatedAt: serverTimestamp()
                                    });
                                    toast.success(t('apartment.updateSuccess'));
                                } catch (error) {
                                    console.error(error);
                                    toast.error(t('common.error'));
                                }
                            }}
                            className={clsx(
                                "w-full appearance-none px-4 py-3 pr-10 rounded-xl font-bold text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer",
                                {
                                    'bg-blue-50 text-blue-800 border-blue-100': apartment.status === 'new',
                                    'bg-yellow-50 text-yellow-800 border-yellow-100': apartment.status === 'called',
                                    'bg-green-50 text-green-800 border-green-100': apartment.status === 'visited',
                                    'bg-gray-50 text-gray-800 border-gray-200 opacity-75': apartment.status === 'rejected',
                                }
                            )}
                        >
                            <option value="new">{t('apartment.status.new')}</option>
                            <option value="called">{t('apartment.status.called')}</option>
                            <option value="visited">{t('apartment.status.visited')}</option>
                            <option value="rejected">{t('apartment.status.rejected')}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" size={16} />
                    </div>
                </div>

                {/* Last Update Info */}
                {apartment.lastUpdatedByName && (
                    <div className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                        <span>{t('apartment.lastUpdatedBy')} {apartment.lastUpdatedByName}</span>
                        {apartment.updatedAt?.seconds && (
                            <span>• {new Date(apartment.updatedAt.seconds * 1000).toLocaleDateString('he-IL')}</span>
                        )}
                    </div>
                )}

                {/* Summary Accordion */}
                <div className="mb-4 border rounded-xl overflow-hidden">
                    <button
                        onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <span className="font-bold text-gray-700 text-sm">{t('apartment.quickSummary')}</span>
                        {isSummaryOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                    </button>
                    {isSummaryOpen && (
                        <div className="p-4 bg-white text-sm text-gray-700">
                            <h4 className="font-bold mb-2">{t('apartment.contains')}</h4>
                            <ul className="list-disc list-inside space-y-1 mb-4">
                                {generateSummary().map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                                {generateSummary().length === 0 && <li>{t('apartment.noDetails')}</li>}
                            </ul>

                            {apartment.notes && (
                                <>
                                    <h4 className="font-bold mb-1">{t('apartment.generalNotes')}</h4>
                                    <p className="whitespace-pre-wrap">{apartment.notes}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Match Status Badge - Compact */}
                {/* Match Status Badge - Compact */}
                <div className={clsx(
                    "mb-2 p-2 rounded-xl border flex items-center gap-2", // Reduced padding & margin, align center
                    isMatch ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
                )}>
                    {isMatch ? (
                        <CheckCircle size={18} className="flex-shrink-0" /> // Smaller icon
                    ) : (
                        <AlertTriangle size={18} className="flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm flex items-center gap-2">
                            {isMatch ? t('settings.match') : t('settings.mismatch')}
                            {!isMatch && (
                                <span className="text-xs font-normal opacity-90 truncate">
                                    ({missingReqs.join(', ')})
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditingReqs(true)}
                        className="p-1 hover:bg-black/5 rounded-full transition-colors flex-shrink-0"
                        title={t('settings.editPreferences') || "ערוך דרישות"}
                    >
                        <Edit size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2"> {/* Reduced gap & margin */}
                    <div className="bg-gray-50 p-2 rounded-xl text-center"> {/* Reduced padding */}
                        <span className="block text-gray-500 text-xs">{t('apartment.price')}</span>
                        <span className="text-lg font-bold text-gray-900">{apartment.price.toLocaleString()} ₪</span>
                    </div>
                    {apartment.link && (
                        <a href={apartment.link} target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-2 rounded-xl text-center flex flex-col items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                            <ExternalLink size={18} className="mb-0.5" />
                            <span className="text-xs font-medium">{t('apartment.link')}</span>
                        </a>
                    )}
                </div>

                {/* Contact Information */}
                {(apartment.ownerName || apartment.ownerPhone || apartment.additionalContactName || apartment.additionalPhone) && (
                    <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-3">
                        {/* Owner */}
                        {(apartment.ownerName || apartment.ownerPhone) && (
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs text-blue-600 font-bold uppercase tracking-wide">{t('apartment.ownerName')}</span>
                                    <span className="font-medium text-gray-900">{apartment.ownerName || '-'}</span>
                                </div>
                                {apartment.ownerPhone && (
                                    <a href={`tel:${apartment.ownerPhone}`} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-blue-600 font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors">
                                        <Phone size={14} />
                                        <span dir="ltr">{apartment.ownerPhone}</span>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Additional Contact */}
                        {(apartment.additionalContactName || apartment.additionalPhone) && (
                            <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                                <div className="flex flex-col">
                                    <span className="text-xs text-blue-600 font-bold uppercase tracking-wide">{t('apartment.additionalContactName')}</span>
                                    <span className="font-medium text-gray-900">{apartment.additionalContactName || '-'}</span>
                                </div>
                                {apartment.additionalPhone && (
                                    <a href={`tel:${apartment.additionalPhone}`} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-blue-600 font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors">
                                        <Phone size={14} />
                                        <span dir="ltr">{apartment.additionalPhone}</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Phases */}
            <div className="p-4 space-y-4">
                {/* Phase 1: Scouting (Always Visible if notes exist) */}
                {apartment.notes && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                            <Eye className="text-blue-500" size={18} />
                            <h2 className="font-bold text-gray-800 text-sm">{t('apartment.phases.scouting')}</h2>
                        </div>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{apartment.notes}</p>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('phone')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all",
                            activeTab === 'phone' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Phone size={16} />
                        {t('apartment.phases.phone')}
                    </button>
                    <button
                        onClick={() => setActiveTab('visit')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all",
                            activeTab === 'visit' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Check size={16} />
                        {t('apartment.phases.visit')}
                    </button>
                    <button
                        onClick={() => setActiveTab('signing')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all",
                            activeTab === 'signing' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <FileSignature size={16} />
                        {t('apartment.phases.signing')}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">

                    {/* Phase 2: Phone Check */}
                    {activeTab === 'phone' && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="space-y-1">
                                {renderBooleanItem('elevator', t('apartment.elevator'))}
                                {renderBooleanItem('parking', t('apartment.parking'))}
                                {renderBooleanItem('balcony', t('apartment.balcony'))}
                                {renderBooleanItem('pets', t('apartment.pets'))}
                                {renderBooleanItem('furnished', t('apartment.furnished'))}
                                {renderBooleanItem('brokerFee', t('apartment.brokerFee'))}
                                {renderBooleanItem('tama38', t('apartment.tama38'))}

                                {/* Custom Phone Items */}
                                {checklistTemplates.filter(t => t.phase === 'phone').map(t => renderCustomItem(t))}

                                {renderAddQuestion('phone')}
                            </div>
                        </div>
                    )}

                    {/* Phase 3: Visit Check */}
                    {activeTab === 'visit' && (
                        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="space-y-1">
                                {renderBooleanItem('naturalLight', t('apartment.naturalLight'))}
                                {renderBooleanItem('waterPressure', t('apartment.waterPressure'))}
                                {renderBooleanItem('noiseLevel', t('apartment.noiseLevel'))}
                                {renderBooleanItem('doubleGlazed', t('apartment.doubleGlazed'))}
                                {renderBooleanItem('mobileReception', t('apartment.mobileReception'))}
                                {renderBooleanItem('moldCheck', t('apartment.moldCheck'))}
                                {renderBooleanItem('bars', t('apartment.bars'))}
                                {renderBooleanItem('ac', t('apartment.ac'))}

                                {/* Custom Visit Items */}
                                {checklistTemplates.filter(t => t.phase === 'visit').map(t => renderCustomItem(t))}

                                {renderAddQuestion('visit')}
                            </div>
                        </div>
                    )}

                    {/* Phase 4: Signing */}
                    {activeTab === 'signing' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-1">
                                {/* Custom Signing Items */}
                                {checklistTemplates.filter(t => t.phase === 'signing').map(t => renderCustomItem(t))}

                                {renderAddQuestion('signing')}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Edit Modal */}
            {isEditingReqs && <QuickEditRequirements onClose={() => setIsEditingReqs(false)} />}
        </div>
    );
}

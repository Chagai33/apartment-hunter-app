import { useState, useEffect } from 'react';

import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { UserPreferences, CustomChecklistTemplate } from '../../../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Input } from '../../common/Input';
import { Save, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { onSnapshot, updateDoc } from 'firebase/firestore';

export function PreferencesForm({ hideHeader }: { hideHeader?: boolean }) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, reset, setValue } = useForm<UserPreferences>();

    const { activeGroupId } = useGroup();

    const [checklistTemplates, setChecklistTemplates] = useState<CustomChecklistTemplate[]>([]);
    const [customFeatureInput, setCustomFeatureInput] = useState('');

    useEffect(() => {
        if (!user) return;

        const loadPreferences = async () => {
            try {
                let prefs: UserPreferences | undefined;

                if (activeGroupId) {
                    const docRef = doc(db, 'groups', activeGroupId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        prefs = docSnap.data().preferences as UserPreferences;
                    }
                } else {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        prefs = userData.preferences as UserPreferences;
                    }
                }

                if (prefs) {
                    reset(prefs);
                } else {
                    reset({}); // Clear form if no preferences found
                }
            } catch (error) {
                console.error("Error loading preferences:", error);
            }
        };

        loadPreferences();
    }, [user, activeGroupId, reset]);

    const onSubmit = async (data: UserPreferences) => {
        if (!user) return;
        setLoading(true);
        try {
            const targetRef = activeGroupId
                ? doc(db, 'groups', activeGroupId)
                : doc(db, 'users', user.uid);

            await setDoc(targetRef, {
                preferences: data
            }, { merge: true });

            toast.success(t('settings.saveSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    // Subscribe to templates based on selected group or user
    useEffect(() => {
        let unsub = () => { };
        if (activeGroupId) {
            unsub = onSnapshot(doc(db, 'groups', activeGroupId), (docSnap) => {
                if (docSnap.exists()) {
                    setChecklistTemplates(docSnap.data().checklistTemplates || []);
                }
            });
        } else if (user) {
            unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                if (docSnap.exists()) {
                    setChecklistTemplates(docSnap.data().checklistTemplates || []);
                }
            });
        }
        return () => unsub();
    }, [activeGroupId, user]);

    const handleAddCustomFeature = async () => {
        if (!customFeatureInput.trim() || !user) return;

        const newTemplate: CustomChecklistTemplate = {
            id: Date.now().toString(),
            label: customFeatureInput.trim(),
            phase: 'phone' // Default to phone check
        };

        const updatedTemplates = [...checklistTemplates, newTemplate];

        try {
            const targetRef = activeGroupId
                ? doc(db, 'groups', activeGroupId)
                : doc(db, 'users', user.uid);

            await updateDoc(targetRef, {
                checklistTemplates: updatedTemplates
            });

            // Automatically add to must haves when creating from settings
            const currentMustHaves = watch('customMustHaves') || [];
            setValue('customMustHaves', [...currentMustHaves, newTemplate.id]);

            setCustomFeatureInput('');
            toast.success(t('apartment.reqAdded', 'Feature added!'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const handleRemoveCustomFeature = async (templateId: string) => {
        if (!user) return;

        // Remove from templates array
        const updatedTemplates = checklistTemplates.filter(t => t.id !== templateId);

        try {
            const targetRef = activeGroupId
                ? doc(db, 'groups', activeGroupId)
                : doc(db, 'users', user.uid);

            await updateDoc(targetRef, {
                checklistTemplates: updatedTemplates
            });

            // Also remove from selected must haves if present
            const currentMustHaves = watch('customMustHaves') || [];
            if (currentMustHaves.includes(templateId)) {
                setValue('customMustHaves', currentMustHaves.filter(id => id !== templateId));
                // Also persist this change immediately to avoid desync
                await setDoc(targetRef, {
                    preferences: { customMustHaves: currentMustHaves.filter(id => id !== templateId) }
                }, { merge: true });
            }

        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const Toggle = ({ name, label }: { name: keyof UserPreferences, label: string }) => {
        const value = watch(name);
        return (
            <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-700">{label}</span>
                <div className={clsx(
                    "w-12 h-6 rounded-full relative transition-colors duration-200",
                    value ? "bg-blue-600" : "bg-gray-200"
                )}>
                    <input type="checkbox" className="hidden" {...register(name)} />
                    <div className={clsx(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm",
                        value ? "right-1" : "right-7"
                    )} />
                </div>
            </label>
        );
    };

    return (
        <div className="p-4 pb-24 max-w-2xl mx-auto">
            {!hideHeader && (
                <>
                    <h1 className="text-2xl font-bold mb-2">{t('settings.title')}</h1>
                    <p className="text-gray-500 mb-6 text-sm">{t('settings.subtitle')}</p>
                </>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Main Profile Settings (Budget + Must Haves) */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">{t('settings.requirementsTitle')}</h2>

                    {/* Budget & Rooms */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <Input
                            label={t('settings.maxPrice')}
                            type="number"
                            {...register('maxPrice', { valueAsNumber: true })}
                        />
                        <Input
                            label={t('settings.minRooms')}
                            type="number"
                            {...register('minRooms', { valueAsNumber: true })}
                        />
                    </div>

                    {/* Must Haves */}
                    <h3 className="font-medium text-gray-700 mb-3 text-sm">{t('settings.mustHaves')}</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <Toggle name="mustHaveElevator" label={t('apartment.elevator')} />
                        <Toggle name="mustHaveParking" label={t('apartment.parking')} />
                        <Toggle name="mustHaveBalcony" label={t('apartment.balcony')} />
                        <Toggle name="mustHaveAC" label={t('apartment.ac')} />
                        <Toggle name="mustHaveMamad" label={t('apartment.mamad')} />
                        <Toggle name="mustHaveTama38" label={t('apartment.tama38')} />
                        <Toggle name="mustHavePets" label={t('apartment.pets')} />
                        <Toggle name="mustHaveFurnished" label={t('apartment.furnished')} />
                    </div>

                    {/* Custom Features Checklist */}
                    <div className="mt-8 border-t pt-6">
                        <h3 className="font-medium text-gray-800 mb-1">{t('settings.customRequirements')}</h3>
                        <p className="text-gray-500 mb-4 text-xs">{t('settings.customRequirementsSubtitle')}</p>

                        {checklistTemplates.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                {checklistTemplates.map(template => {
                                    const customMustHaves = watch('customMustHaves') || [];
                                    const isSelected = customMustHaves.includes(template.id);

                                    return (
                                        <div key={template.id} className="flex items-center gap-2">
                                            <div
                                                onClick={() => {
                                                    const newValue = isSelected
                                                        ? customMustHaves.filter(id => id !== template.id)
                                                        : [...customMustHaves, template.id];
                                                    setValue('customMustHaves', newValue);
                                                }}
                                                className="flex-1 flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-medium text-gray-700 truncate" title={template.label}>{template.label}</span>
                                                <div className={clsx(
                                                    "w-12 h-6 rounded-full relative transition-colors duration-200 shrink-0",
                                                    isSelected ? "bg-blue-600" : "bg-gray-200"
                                                )}>
                                                    <div className={clsx(
                                                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm",
                                                        isSelected ? "right-1" : "right-7"
                                                    )} />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomFeature(template.id)}
                                                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add Custom Feature */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2 space-y-3">
                            <label className="block text-sm font-medium text-gray-700">{t('settings.addNewRequirement', 'הוסף מאפיין חדש')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customFeatureInput}
                                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustomFeature();
                                        }
                                    }}
                                    placeholder={t('settings.reqPlaceholder', 'למשל: מחסן, משופצת, כיווני אוויר...')}
                                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomFeature}
                                    disabled={!customFeatureInput.trim()}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                                >
                                    {t('common.add', 'הוסף')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 sticky bottom-4 shadow-lg hover:bg-blue-700 transition-colors"
                >
                    {loading ? (
                        <span>{t('common.loading')}</span>
                    ) : (
                        <>
                            <Save size={20} />
                            {t('common.save')}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

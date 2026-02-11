import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { UserPreferences } from '../../../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HE } from '../../../lib/i18n';
import { Input } from '../../common/Input';
import { Save, Check, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { CustomChecklistTemplate } from '../../../types';

export function PreferencesForm() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, setValue, watch } = useForm<UserPreferences>();

    const [checklistTemplates, setChecklistTemplates] = useState<CustomChecklistTemplate[]>([]);
    const [savedProfiles, setSavedProfiles] = useState<{ id: string, name: string, preferences: UserPreferences }[]>([]);
    const [newTemplateLabel, setNewTemplateLabel] = useState('');
    const [newTemplatePhase, setNewTemplatePhase] = useState<'scouting' | 'phone' | 'visit' | 'signing'>('phone');
    const [newProfileName, setNewProfileName] = useState('');

    useEffect(() => {
        if (!user) return;
        const loadUserData = async () => {
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    if (userData.preferences) {
                        const prefs = userData.preferences as UserPreferences;
                        Object.entries(prefs).forEach(([key, value]) => {
                            setValue(key as keyof UserPreferences, value);
                        });
                    }
                    if (userData.checklistTemplates) {
                        setChecklistTemplates(userData.checklistTemplates);
                    }
                    if (userData.savedProfiles) {
                        setSavedProfiles(userData.savedProfiles);
                    }
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            }
        };
        loadUserData();
    }, [user, setValue]);

    const onSubmit = async (data: UserPreferences) => {
        if (!user) return;
        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                preferences: data,
                checklistTemplates,
                savedProfiles
            }, { merge: true });
            toast.success(HE.settings.saveSuccess);
        } catch (error) {
            console.error(error);
            toast.error(HE.common.error);
        } finally {
            setLoading(false);
        }
    };

    const addTemplate = () => {
        if (!newTemplateLabel.trim()) return;
        const newTemplate: CustomChecklistTemplate = {
            id: Date.now().toString(),
            label: newTemplateLabel,
            phase: newTemplatePhase
        };
        setChecklistTemplates([...checklistTemplates, newTemplate]);
        setNewTemplateLabel('');
    };

    const removeTemplate = (id: string) => {
        setChecklistTemplates(checklistTemplates.filter(t => t.id !== id));
    };

    const saveCurrentProfile = () => {
        if (!newProfileName.trim()) return;
        const currentPrefs = watch();
        const newProfile = {
            id: Date.now().toString(),
            name: newProfileName,
            preferences: currentPrefs
        };
        setSavedProfiles([...savedProfiles, newProfile]);
        setNewProfileName('');
        toast.success(HE.settings.profileSaved);
    };

    const loadProfile = (profile: { preferences: UserPreferences }) => {
        Object.entries(profile.preferences).forEach(([key, value]) => {
            setValue(key as keyof UserPreferences, value);
        });
        toast.success(HE.settings.profileLoaded);
    };

    const removeProfile = (id: string) => {
        setSavedProfiles(savedProfiles.filter(p => p.id !== id));
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
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-2">{HE.settings.title}</h1>
            <p className="text-gray-500 mb-6 text-sm">{HE.settings.subtitle}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Profiles Management */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-3 border-b pb-2">{HE.settings.savedProfiles}</h2>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            placeholder={HE.settings.newProfilePlaceholder}
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        />
                        <button type="button" onClick={saveCurrentProfile} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                            שמור
                        </button>
                    </div>

                    <div className="space-y-2">
                        {savedProfiles.map(profile => (
                            <div key={profile.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                <span className="font-medium text-sm">{profile.name}</span>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => loadProfile(profile)} className="text-blue-600 text-xs font-bold px-2 py-1 bg-blue-50 rounded">
                                        {HE.settings.load}
                                    </button>
                                    <button type="button" onClick={() => removeProfile(profile.id)} className="text-red-600 text-xs font-bold px-2 py-1 hover:bg-red-50 rounded">
                                        {HE.common.delete}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {savedProfiles.length === 0 && <p className="text-gray-400 text-xs italic">{HE.settings.noProfiles}</p>}
                    </div>
                </section>

                {/* Main Profile Settings (Budget + Must Haves) */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">הגדרות חיפוש (תקציב ודרישות)</h2>

                    {/* Budget & Rooms */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <Input
                            label={HE.settings.maxPrice}
                            type="number"
                            {...register('maxPrice', { valueAsNumber: true })}
                        />
                        <Input
                            label={HE.settings.minRooms}
                            type="number"
                            {...register('minRooms', { valueAsNumber: true })}
                        />
                    </div>

                    {/* Must Haves */}
                    <h3 className="font-medium text-gray-700 mb-3 text-sm">דרישות חובה (Must Haves)</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <Toggle name="mustHaveElevator" label={HE.apartment.elevator} />
                        <Toggle name="mustHaveParking" label={HE.apartment.parking} />
                        <Toggle name="mustHaveBalcony" label={HE.apartment.balcony} />
                        <Toggle name="mustHaveAC" label={HE.apartment.ac} />
                        <Toggle name="mustHaveMamad" label="ממ״ד" />
                        <Toggle name="mustHaveTama38" label="תמ״א 38" />
                        <Toggle name="mustHavePets" label={HE.apartment.pets} />
                        <Toggle name="mustHaveFurnished" label={HE.apartment.furnished} />
                    </div>
                </section>

                {/* Custom Checklist Templates */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-3 border-b pb-2">{HE.settings.customChecklist}</h2>
                    <p className="text-xs text-gray-500 mb-3">{HE.settings.customChecklistSubtitle}</p>

                    <div className="flex flex-col gap-2 mb-4">
                        <input
                            type="text"
                            value={newTemplateLabel}
                            onChange={(e) => setNewTemplateLabel(e.target.value)}
                            placeholder={HE.settings.newQuestionPlaceholder}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                            <select
                                value={newTemplatePhase}
                                onChange={(e) => setNewTemplatePhase(e.target.value as any)}
                                className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                <option value="phone">בדיקה טלפונית</option>
                                <option value="visit">ביקור בדירה</option>
                                <option value="signing">{HE.apartment.phases.signing}</option>
                            </select>
                            <button type="button" onClick={addTemplate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap">
                                {HE.common.add}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {checklistTemplates.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border-r-4 border-blue-500">
                                <div>
                                    <span className="font-medium text-sm block">{t.label}</span>
                                    <span className="text-xs text-gray-400">
                                        {t.phase === 'phone' ? 'טלפוני' : t.phase === 'visit' ? 'ביקור' : 'חוזה'}
                                    </span>
                                </div>
                                <button type="button" onClick={() => removeTemplate(t.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {checklistTemplates.length === 0 && <p className="text-gray-400 text-xs italic">אין שאלות מותאמות אישית</p>}
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 sticky bottom-4 shadow-lg hover:bg-blue-700 transition-colors"
                >
                    {loading ? (
                        <span>{HE.common.loading}</span>
                    ) : (
                        <>
                            <Save size={20} />
                            {HE.common.save}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

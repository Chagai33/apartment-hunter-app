import { useState, useEffect } from 'react';

import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { UserPreferences } from '../../../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Input } from '../../common/Input';
import { Save } from 'lucide-react';
import { clsx } from 'clsx';

export function PreferencesForm({ hideHeader }: { hideHeader?: boolean }) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, watch, reset } = useForm<UserPreferences>();

    const { activeGroupId } = useGroup();

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

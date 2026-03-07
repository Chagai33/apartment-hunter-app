import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useApartments } from '../../../hooks/useApartments';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Input } from '../../common/Input';
import { Apartment, CustomChecklistTemplate } from '../../../types';
import { onSnapshot, updateDoc } from 'firebase/firestore';

export function ApartmentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { activeGroupId, groups } = useGroup();
    const { addApartment, updateApartment } = useApartments();
    const { t } = useTranslation();

    // "loading" for submission, "fetching" for initial data load
    const [submitting, setSubmitting] = useState(false);
    const [fetching, setFetching] = useState(!!id); // Start fetching if we have an ID

    // State for toggling additional contact details
    const [showAdditionalContact, setShowAdditionalContact] = useState(false);

    const [customChecks, setCustomChecks] = useState<Record<string, boolean>>({});
    const [checklistTemplates, setChecklistTemplates] = useState<CustomChecklistTemplate[]>([]);
    const [customFeatureInput, setCustomFeatureInput] = useState('');

    // We use Partial<Apartment> for the form values
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Partial<Apartment>>({
        defaultValues: {
            address: '',
            neighborhood: '',
            price: 0,
            notes: '',
            rooms: 0,
            // Add groupId to defaultValues if activeGroupId is null
            groupId: activeGroupId || (groups.length > 0 ? groups[0].id : ''),
        }
    });

    // Auto-select group if available (Only for new apartments)
    useEffect(() => {
        if (id) return; // Don't override group for existing apartments

        if (activeGroupId) {
            setValue('groupId', activeGroupId);
        } else if (groups.length > 0) {
            setValue('groupId', groups[0].id);
        }
    }, [activeGroupId, groups, setValue, id]);

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const loadApartment = async () => {
            // ... existing load logic
            try {
                const docRef = doc(db, 'apartments', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && isMounted) {
                    const data = docSnap.data() as Apartment;

                    // Auto-open additional contact if it has data
                    if (data.additionalContactName || data.additionalPhone) {
                        setShowAdditionalContact(true);
                    }

                    if (data.customChecks) {
                        setCustomChecks(data.customChecks);
                    }

                    // Best Practice: Reset the form with the data.
                    reset({
                        address: data.address,
                        neighborhood: data.neighborhood,
                        price: data.price,
                        rooms: data.rooms,
                        link: data.link,
                        elevator: data.elevator,
                        parking: data.parking,
                        balcony: data.balcony,
                        ac: data.ac,
                        tama38: data.tama38,
                        pets: data.pets,
                        furnished: data.furnished,
                        notes: data.notes,
                        groupId: data.groupId, // Keep existing group
                        ownerName: data.ownerName || '',
                        ownerPhone: data.ownerPhone || '',
                        additionalContactName: data.additionalContactName || '',
                        additionalPhone: data.additionalPhone || ''
                    });
                }
            } catch (error) {
                console.error("Error loading apartment:", error);
                toast.error(t('common.error'));
                navigate('/');
            } finally {
                if (isMounted) setFetching(false);
            }
        };

        loadApartment();

        return () => {
            isMounted = false;
        };
    }, [id, reset, navigate, t]);

    const watchGroupId = watch('groupId');

    // Subscribe to templates based on selected group or user
    useEffect(() => {
        let unsub = () => { };
        if (watchGroupId) {
            unsub = onSnapshot(doc(db, 'groups', watchGroupId), (docSnap) => {
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
    }, [watchGroupId, user]);

    const onSubmit = async (data: any) => {
        if (!user) return;
        setSubmitting(true);

        try {
            if (id) {
                // Update existing
                await updateApartment(id, {
                    ...data,
                    customChecks,
                    price: Number(data.price),
                    rooms: Number(data.rooms),
                    lastUpdatedBy: user.uid,
                    lastUpdatedByName: user.displayName || user.email || 'Unknown',
                });
                toast.success(t('apartment.updateSuccess'));
            } else {
                // Create new
                await addApartment({
                    ...data,
                    customChecks,
                    price: Number(data.price),
                    rooms: Number(data.rooms),
                    status: 'new',
                    // Init flags
                    elevator: data.elevator || false,
                    parking: data.parking || false,
                    balcony: data.balcony || false,
                    ac: data.ac || false,
                    tama38: data.tama38 || false,
                    pets: data.pets || false,
                    furnished: data.furnished || false,
                    brokerFee: false,
                    createdByName: user.displayName || user.email || 'Unknown',
                    lastUpdatedBy: user.uid,
                    lastUpdatedByName: user.displayName || user.email || 'Unknown',
                }, data.groupId);

                toast.success(t('apartment.addSuccess'));
            }

            // Small delay for UX
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);

        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddCustomFeature = async () => {
        if (!customFeatureInput.trim() || !user) return;

        const newTemplate: CustomChecklistTemplate = {
            id: Date.now().toString(),
            label: customFeatureInput.trim(),
            phase: 'phone' // Default to phone check as requested
        };

        const updatedTemplates = [...checklistTemplates, newTemplate];

        try {
            const targetRef = watchGroupId
                ? doc(db, 'groups', watchGroupId)
                : doc(db, 'users', user.uid);

            await updateDoc(targetRef, {
                checklistTemplates: updatedTemplates
            });

            // Automatically check the new template for the current apartment being edited
            setCustomChecks(prev => ({
                ...prev,
                [newTemplate.id]: true
            }));

            setCustomFeatureInput('');
            toast.success(t('apartment.reqAdded', 'Feature added!'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    if (fetching) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">{id ? t('common.edit') : t('apartment.addNew')}</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {!activeGroupId && !id && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.selectGroup', 'Select Group')}</label>
                        <select
                            {...register('groupId', { required: true })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer bg-white"
                        >
                            <option value="">{t('common.selectGroupPlaceholder', '-- Select Group --')}</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label={t('apartment.address')} {...register('address', { required: true })} />
                    <Input label={t('apartment.neighborhood')} {...register('neighborhood', { required: true })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label={t('apartment.price')} type="number" {...register('price', { required: true })} />

                    {/* Rooms Input */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">{t('apartment.rooms')}</label>
                        <input
                            type="number"
                            step="0.5"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            {...register('rooms')}
                        />
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-700">{t('apartment.details', 'Contact Details')}</h3>

                    {/* Owner */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={t('apartment.ownerName')}
                            {...register('ownerName')}
                            placeholder={t('apartment.ownerName')}
                        />
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">{t('apartment.ownerPhone')}</label>
                            <input
                                type="tel"
                                dir="ltr"
                                className={clsx(
                                    "w-full px-4 py-2 rounded-xl border outline-none transition-all",
                                    errors.ownerPhone ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                                )}
                                {...register('ownerPhone', {
                                    pattern: {
                                        value: /^(?:(?:(\+?972|\(\+?972\)|\+?\(972\))(?:\s|\.|-)?([1-9]\d?))|(0[23489]|05[0-689]|07[78]))(?:\s|\.|-)?([^0\D]\d{2})(?:\s|\.|-)?(\d{4})$/,
                                        message: t('validation.invalidPhone')
                                    }
                                })}
                                placeholder="050-0000000"
                            />
                            {errors.ownerPhone && <span className="text-xs text-red-500">{errors.ownerPhone.message}</span>}
                        </div>
                    </div>

                    {/* Additional Contact Toggle */}
                    {!showAdditionalContact ? (
                        <button
                            type="button"
                            onClick={() => setShowAdditionalContact(true)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('apartment.addAdditionalContact', 'הוסף איש קשר נוסף')}
                        </button>
                    ) : (
                        <div className="space-y-4 pt-2 border-t border-gray-100 mt-4">
                            <div className="flex justify-between items-center text-sm text-gray-700">
                                <span>{t('apartment.additionalContact', 'איש קשר נוסף')}</span>
                                <button
                                    type="button"
                                    onClick={() => setShowAdditionalContact(false)}
                                    className="text-red-500 hover:text-red-700 font-medium transition-colors"
                                >
                                    {t('common.remove', 'הסר')}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={t('apartment.additionalContactName')}
                                    {...register('additionalContactName')}
                                    placeholder={t('apartment.additionalContactName')}
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">{t('apartment.additionalPhone')}</label>
                                    <input
                                        type="tel"
                                        dir="ltr"
                                        className={clsx(
                                            "w-full px-4 py-2 rounded-xl border outline-none transition-all",
                                            errors.additionalPhone ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                                        )}
                                        {...register('additionalPhone', {
                                            pattern: {
                                                value: /^(?:(?:(\+?972|\(\+?972\)|\+?\(972\))(?:\s|\.|-)?([1-9]\d?))|(0[23489]|05[0-689]|07[78]))(?:\s|\.|-)?([^0\D]\d{2})(?:\s|\.|-)?(\d{4})$/,
                                                message: t('validation.invalidPhone')
                                            }
                                        })}
                                        placeholder="050-0000000"
                                    />
                                    {errors.additionalPhone && <span className="text-xs text-red-500">{errors.additionalPhone.message}</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Link Input */}
                <Input label={t('apartment.link')} type="url" {...register('link')} placeholder="https://..." />

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('elevator')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.elevator')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('parking')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.parking')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('balcony')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.balcony')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('ac')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.ac')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('tama38')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.mamad')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('pets')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.pets')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('furnished')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.furnished')}</span>
                    </label>
                </div>

                {/* Custom Features Checkboxes */}
                {checklistTemplates.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                        {checklistTemplates.map(template => (
                            <label key={template.id} className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-blue-50/50 p-2 rounded-xl hover:bg-blue-50 transition-colors border border-blue-50/0 hover:border-blue-100">
                                <input
                                    type="checkbox"
                                    checked={customChecks[template.id] || false}
                                    onChange={(e) => setCustomChecks({ ...customChecks, [template.id]: e.target.checked })}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-gray-700 font-medium mr-2 truncate" title={template.label}>{template.label}</span>
                            </label>
                        ))}
                    </div>
                )}

                {/* Add Custom Feature */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4 space-y-3">
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
                            placeholder={t('apartment.addCustomFeaturePlaceholder', 'למשל: מחסן, משופצת, כיווני אוויר...')}
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

                <div className="flex flex-col gap-1 mt-4">
                    <label className="text-sm font-medium text-gray-700">{t('apartment.notes')}</label>
                    <textarea
                        className="p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        rows={3}
                        {...register('notes')}
                    />
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-8">
                    {submitting ? t('common.loading') : t('common.save')}
                </button>
            </form>
        </div>
    );
}

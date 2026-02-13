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
import { Apartment } from '../../../types';

export function ApartmentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { activeGroupId, groups } = useGroup(); // Use Context
    const { addApartment, updateApartment } = useApartments(); // Get addApartment and updateApartment from the hook
    const { t } = useTranslation();

    // "loading" for submission, "fetching" for initial data load
    const [submitting, setSubmitting] = useState(false);
    const [fetching, setFetching] = useState(!!id); // Start fetching if we have an ID

    // We use Partial<Apartment> for the form values
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<Apartment>>({
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

    const onSubmit = async (data: any) => {
        if (!user) return;
        setSubmitting(true);

        try {
            if (id) {
                // Update existing
                await updateApartment(id, {
                    ...data,
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
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer bg-white"
                        >
                            <option value="">{t('common.selectGroupPlaceholder', '-- Select Group --')}</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <Input label={t('apartment.address')} {...register('address', { required: true })} />
                <Input label={t('apartment.neighborhood')} {...register('neighborhood', { required: true })} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label={t('apartment.price')} type="number" {...register('price', { required: true })} />

                    {/* Rooms Input */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">{t('apartment.rooms')}</label>
                        <input
                            type="number"
                            step="0.5"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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
                                    "w-full px-4 py-3 rounded-xl border outline-none transition-all",
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

                    {/* Additional Contact */}
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
                                    "w-full px-4 py-3 rounded-xl border outline-none transition-all",
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

                {/* Link Input */}
                <Input label={t('apartment.link')} type="url" {...register('link')} placeholder="https://..." />

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('elevator')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.elevator')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('parking')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.parking')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('balcony')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.balcony')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('ac')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.ac')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('tama38')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.mamad')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('pets')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.pets')}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('furnished')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{t('apartment.furnished')}</span>
                    </label>
                </div>

                <div className="flex flex-col gap-1 mt-4">
                    <label className="text-sm font-medium text-gray-700">{t('apartment.notes')}</label>
                    <textarea
                        className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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

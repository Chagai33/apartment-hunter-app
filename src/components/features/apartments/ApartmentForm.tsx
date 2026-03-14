import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useApartments } from '../../../hooks/useApartments';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Input } from '../../common/Input';
import { Apartment, CustomChecklistTemplate } from '../../../types';
import { onSnapshot, updateDoc } from 'firebase/firestore';
import { SmartImportDropzone } from './SmartImportDropzone';

const BooleanToggle = ({ control, name, label, t }: { control: any, name: keyof Apartment, label: string, t: any }) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => (
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => field.onChange(field.value === true ? null : true)}
                        className={clsx(
                            "flex-1 py-1.5 text-sm rounded-lg transition-colors",
                            field.value === true
                                ? "bg-white shadow-sm font-semibold text-blue-600 ring-1 ring-blue-100"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        {t('common.yes', 'כן')}
                    </button>
                    <button
                        type="button"
                        onClick={() => field.onChange(field.value === false ? null : false)}
                        className={clsx(
                            "flex-1 py-1.5 text-sm rounded-lg transition-colors",
                            field.value === false
                                ? "bg-white shadow-sm font-semibold text-red-600 ring-1 ring-red-100"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        {t('common.no', 'לא')}
                    </button>
                </div>
            </div>
        )}
    />
);

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

    // State for the 2-step wizard and source hiding
    const [formStep, setFormStep] = useState<'essential' | 'details'>('essential');
    const [showSource, setShowSource] = useState(false);

    // State for toggling additional contact details
    const [showAdditionalContact, setShowAdditionalContact] = useState(false);

    const [customChecks, setCustomChecks] = useState<Record<string, boolean>>({});
    const [checklistTemplates, setChecklistTemplates] = useState<CustomChecklistTemplate[]>([]);
    const [customFeatureInput, setCustomFeatureInput] = useState('');

    // Smart Import State
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedMissingFields, setExtractedMissingFields] = useState<string[]>([]);

    // We use Partial<Apartment> for the form values
    const { register, control, handleSubmit, reset, setValue, watch, getValues, formState: { errors } } = useForm<Partial<Apartment>>({
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
    const watchSourceText = watch('sourceText');
    const formValues = watch();

    const hasValue = (name: string, isCheckbox = false) => {
        const val = formValues[name as keyof typeof formValues];
        if (isCheckbox) return val === true || val === false;
        if (typeof val === 'number') return !isNaN(val);
        if (typeof val === 'string') return val.trim().length > 0;
        return val !== null && val !== undefined && val !== '';
    };

    const isVisible = (name: string, isCheckbox = false) => {
        if (formStep === 'details') return true;
        if (['address', 'price', 'rooms'].includes(name)) return true;
        return hasValue(name, isCheckbox);
    };

    const isGroupVisible = (names: { name: string, isCheckbox?: boolean }[]) => {
        if (formStep === 'details') return true;
        return names.some(f => isVisible(f.name, f.isCheckbox));
    };

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

    const onFormError = (errors: any) => {
        console.error("Form validation errors:", errors);
        toast.error(t('apartment.validationRequired', 'נא למלא את כל שדות החובה או לתקן את השגיאות בטופס'));
    };

    const onSubmit = async (data: any) => {
        if (!user) return;
        setSubmitting(true);

        const parsedData = {
            ...data,
            customChecks,
            price: data.price ? Number(data.price) : 0,
            rooms: data.rooms ? Number(data.rooms) : 0,
            floor: data.floor ? Number(data.floor) : null,
            size: data.size ? Number(data.size) : null,
            vaad: data.vaad ? Number(data.vaad) : null,
            arnona: data.arnona ? Number(data.arnona) : null,
        };

        try {
            if (id) {
                // Update existing
                await updateApartment(id, {
                    ...parsedData,
                    lastUpdatedBy: user.uid,
                    lastUpdatedByName: user.displayName || user.email || 'Unknown',
                });
                toast.success(t('apartment.updateSuccess'));
            } else {
                // Create new
                await addApartment({
                    ...parsedData,
                    status: 'new',
                    // Init flags
                    elevator: data.elevator || false,
                    parking: data.parking || false,
                    balcony: data.balcony || false,
                    ac: data.ac || false,
                    tama38: data.tama38 || false,
                    pets: data.pets || false,
                    furnished: data.furnished || false,
                    rearFacing: data.rearFacing || false,
                    frontFacing: data.frontFacing || false,
                    brokerFee: data.brokerFee || false,
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

        } catch (error: any) {
            console.error(error);
            // Provide a clear error to the user rather than a generic one
            const errorMessage = error?.message || t('common.error', 'אירעה שגיאה');
            toast.error(`${t('common.errorDetails', 'שגיאה:')} ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddCustomFeature = async () => {
        if (!customFeatureInput.trim() || !user) return;

        const inputLabel = customFeatureInput.trim();

        // Check if it already exists
        const existingTemplate = checklistTemplates.find(t => t.label.toLowerCase() === inputLabel.toLowerCase());

        if (existingTemplate) {
            setCustomChecks(prev => ({
                ...prev,
                [existingTemplate.id]: true
            }));
            setCustomFeatureInput('');
            toast.success(t('apartment.reqAdded', 'Feature added!'));
            return;
        }

        const newTemplate: CustomChecklistTemplate = {
            id: Date.now().toString(),
            label: inputLabel,
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

    const handleExtractSuccess = async (data: any, originalSource: string) => {
        console.log("DATA RECEIVED FROM AI:", data);
        
        // Find custom checks matching the inferred ones
        let newCustomChecks = { ...customChecks };
        let updatedTemplates = [...checklistTemplates];
        let hasNewTemplates = false;
        
        const extractedFeatures = Array.isArray(data.inferredCustomFeatures) 
            ? data.inferredCustomFeatures 
            : Object.keys(data.inferredCustomChecks || {}).filter(k => data.inferredCustomChecks[k]);

        const extractedCustomChecksMap: Record<string, boolean> = {};

        extractedFeatures.forEach((key: string) => {
            if (typeof key !== 'string') return;
            extractedCustomChecksMap[key] = true;

            const matchedTemplate = updatedTemplates.find(ct =>
                ct.label.toLowerCase().includes(key.toLowerCase()) ||
                key.toLowerCase().includes(ct.label.toLowerCase())
            );

            if (matchedTemplate) {
                newCustomChecks[matchedTemplate.id] = true;
            } else if (user) {
                // Create new template for unmatched extracted feature
                const newId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
                const newTemplate: CustomChecklistTemplate = {
                    id: newId,
                    label: key,
                    phase: 'phone'
                };
                updatedTemplates.push(newTemplate);
                newCustomChecks[newId] = true;
                hasNewTemplates = true;
            }
        });

        if (hasNewTemplates && user) {
            try {
                const targetRef = watchGroupId
                    ? doc(db, 'groups', watchGroupId)
                    : doc(db, 'users', user.uid);
                await updateDoc(targetRef, {
                    checklistTemplates: updatedTemplates
                });
            } catch (err) {
                console.error("Error saving new extracted templates:", err);
            }
        }

        setCustomChecks(newCustomChecks);

        const currentValues = getValues();
        const mergedInferredCustomChecks = { ...(currentValues.inferredCustomChecks || {}), ...extractedCustomChecksMap };

        // Populate Form
        reset({
            ...currentValues, // Keep current group id and refs
            sourceText: originalSource || currentValues.sourceText,
            address: data.address || currentValues.address,
            neighborhood: data.neighborhood || currentValues.neighborhood,
            price: data.price || currentValues.price,
            rooms: data.rooms || currentValues.rooms,
            floor: data.floor != null ? data.floor : currentValues.floor,
            size: data.size != null ? data.size : currentValues.size,
            vaad: data.vaad != null ? data.vaad : currentValues.vaad,
            arnona: data.arnona != null ? data.arnona : currentValues.arnona,
            brokerFee: data.brokerFee != null ? data.brokerFee : currentValues.brokerFee,
            entranceDate: data.entranceDate || currentValues.entranceDate,
            rearFacing: data.rearFacing != null ? data.rearFacing : currentValues.rearFacing,
            frontFacing: data.frontFacing != null ? data.frontFacing : currentValues.frontFacing,
            elevator: data.elevator != null ? data.elevator : currentValues.elevator,
            parking: data.parking != null ? data.parking : currentValues.parking,
            balcony: data.balcony != null ? data.balcony : currentValues.balcony,
            ac: data.ac != null ? data.ac : currentValues.ac,
            tama38: data.tama38 != null ? data.tama38 : currentValues.tama38,
            pets: data.pets != null ? data.pets : currentValues.pets,
            furnished: data.furnished != null ? data.furnished : currentValues.furnished,
            notes: data.notes || currentValues.notes,
            ownerName: data.ownerName || currentValues.ownerName,
            ownerPhone: data.ownerPhone || currentValues.ownerPhone,
            inferredCustomChecks: mergedInferredCustomChecks,
        });

        if (data.ownerName || data.ownerPhone) {
            setShowAdditionalContact(true);
        }

        // Highlight missing main fields
        const missing = [];
        if (!data.address) missing.push('address');
        if (!data.price) missing.push('price');
        setExtractedMissingFields(missing);

        setFormStep('essential'); // Reset to essential view after import
        setIsExtracting(false);
    };

    return (
        <div className="p-4 pb-24 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">{id ? t('common.edit') : t('apartment.addNew')}</h1>

            {/* Smart Import Form (Only visible when creating a new apartment, or we can allow everywhere) */}
            <SmartImportDropzone
                onExtractStart={() => setIsExtracting(true)}
                onExtractEnd={() => setIsExtracting(false)}
                onExtractSuccess={handleExtractSuccess}
                customCheckLabels={checklistTemplates.map(t => t.label)}
            />

            {isExtracting && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 flex flex-col items-center justify-center border border-blue-100 shadow-sm my-8 relative">
                    <button
                        type="button"
                        onClick={() => setIsExtracting(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Cancel"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-blue-900 font-medium">{t('apartment.extractingDetails')}</p>
                    <p className="text-sm text-blue-600/70 mt-1">{t('apartment.takesFewSeconds')}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit, onFormError)} className={clsx("space-y-4 transition-opacity duration-300", isExtracting && "opacity-20 pointer-events-none")}>

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

                <div className="space-y-6">
                    {/* --- Group 1: Basic Specs --- */}
                    {isGroupVisible([{ name: 'address' }, { name: 'neighborhood' }, { name: 'price' }, { name: 'rooms' }, { name: 'floor' }, { name: 'size' }, { name: 'entranceDate' }, { name: 'link' }]) && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">{t('apartment.groups.basicSpecs', 'Basic Specifications')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isVisible('address') && (
                                    <div className={clsx("transition-all", extractedMissingFields.includes('address') && "ring-2 ring-orange-400 rounded-xl")}>
                                        <Input label={t('apartment.address')} {...register('address', { required: true })} />
                                    </div>
                                )}
                                {isVisible('neighborhood') && (
                                    <Input label={t('apartment.neighborhood')} {...register('neighborhood', { required: true })} />
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {isVisible('price') && (
                                    <div className={clsx("transition-all", extractedMissingFields.includes('price') && "ring-2 ring-orange-400 rounded-xl")}>
                                        <Input label={t('apartment.price')} type="number" {...register('price', { required: true })} />
                                    </div>
                                )}
                                {isVisible('rooms') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">{t('apartment.rooms')}</label>
                                        <input type="number" step="0.5" className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500" {...register('rooms')} />
                                    </div>
                                )}
                                {isVisible('floor') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">{t('apartment.floor', 'Floor')}</label>
                                        <input type="number" className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500" {...register('floor')} />
                                    </div>
                                )}
                                {isVisible('size') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">{t('apartment.size', 'Size (m²)')}</label>
                                        <input type="number" className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500" {...register('size')} />
                                    </div>
                                )}
                                {isVisible('entranceDate') && (
                                    <Input label={t('apartment.entranceDate', 'Entrance Date')} {...register('entranceDate')} placeholder={t('apartment.entranceDatePlaceholder', 'e.g. 1.8, Immediate...')} />
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {isVisible('link') && (
                                    <Input label={t('apartment.link')} type="url" {...register('link')} placeholder="https://..." />
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- Group 5: Contact Information (Moved up for Essential view) --- */}
                    {isGroupVisible([{ name: 'ownerName' }, { name: 'ownerPhone' }, { name: 'additionalContactName' }, { name: 'additionalPhone' }]) && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">{t('apartment.groups.contactDetails', 'Contact Details')}</h3>

                            {/* Owner */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isVisible('ownerName') && (
                                    <Input
                                        label={t('apartment.ownerName')}
                                        {...register('ownerName')}
                                        placeholder={t('apartment.ownerName')}
                                    />
                                )}
                                {isVisible('ownerPhone') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">{t('apartment.ownerPhone')}</label>
                                        <input
                                            type="tel"
                                            dir="ltr"
                                            className={clsx(
                                                "w-full px-4 py-2 rounded-xl border outline-none transition-all",
                                                errors.ownerPhone ? "border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50" : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                                            )}
                                            {...register('ownerPhone', {
                                                pattern: {
                                                    value: /^(?:(?:(\+?972|\(\+?972\)|\+?\(972\))(?:\s|\.|-)?([1-9]\d?))|(0[23489]|05[0-689]|07[78]))(?:\s|\.|-)?([^0\D]\d{2})(?:\s|\.|-)?(\d{4})$/,
                                                    message: t('validation.invalidPhone', 'Invalid 10-digit phone number')
                                                }
                                            })}
                                            placeholder="050-0000000"
                                        />
                                        {errors.ownerPhone && <span className="text-xs text-red-500 font-semibold">{errors.ownerPhone.message}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Additional Contact Toggle */}
                            {(formStep === 'details' || showAdditionalContact) && (
                                <>
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
                                        <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                                            <div className="flex justify-between items-center text-sm text-gray-700">
                                                <span className="font-semibold">{t('apartment.additionalContact', 'איש קשר נוסף')}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAdditionalContact(false)}
                                                    className="text-red-500 hover:text-red-700 font-medium transition-colors"
                                                >
                                                    {t('common.remove', 'הסר')}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {isVisible('additionalContactName') && (
                                                    <Input
                                                        label={t('apartment.additionalContactName')}
                                                        {...register('additionalContactName')}
                                                        placeholder={t('apartment.additionalContactName')}
                                                    />
                                                )}
                                                {isVisible('additionalPhone') && (
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-sm font-medium text-gray-700">{t('apartment.additionalPhone')}</label>
                                                        <input
                                                            type="tel"
                                                            dir="ltr"
                                                            className={clsx(
                                                                "w-full px-4 py-2 rounded-xl border outline-none transition-all",
                                                                errors.additionalPhone ? "border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50" : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                                                            )}
                                                            {...register('additionalPhone', {
                                                                pattern: {
                                                                    value: /^(?:(?:(\+?972|\(\+?972\)|\+?\(972\))(?:\s|\.|-)?([1-9]\d?))|(0[23489]|05[0-689]|07[78]))(?:\s|\.|-)?([^0\D]\d{2})(?:\s|\.|-)?(\d{4})$/,
                                                                    message: t('validation.invalidPhone', 'Invalid 10-digit phone number')
                                                                }
                                                            })}
                                                            placeholder="050-0000000"
                                                        />
                                                        {errors.additionalPhone && <span className="text-xs text-red-500 font-semibold">{errors.additionalPhone.message}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {formStep === 'essential' && (
                        <div className="flex justify-center mt-6">
                            <button
                                type="button"
                                onClick={() => setFormStep('details')}
                                className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                            >
                                {t('apartment.showAllDetails', 'הצג את כל שאר הפרטים (אופציונלי)')}
                            </button>
                        </div>
                    )}

                    {/* --- Group 2: Financials --- */}
                    {isGroupVisible([{ name: 'vaad' }, { name: 'arnona' }, { name: 'brokerFee', isCheckbox: true }]) && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">{t('apartment.groups.financials', 'Financials')}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {isVisible('vaad') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">{t('apartment.vaad', 'Vaad Bayit')}</label>
                                        <input type="number" className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500" {...register('vaad')} />
                                    </div>
                                )}
                                {isVisible('arnona') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">{t('apartment.arnona', 'Arnona (Bi-monthly)')}</label>
                                        <input type="number" className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500" {...register('arnona')} />
                                    </div>
                                )}
                                {isVisible('brokerFee', true) && (
                                    <div className="flex items-center mt-6 w-full">
                                        <div className="w-full">
                                            <BooleanToggle control={control} name="brokerFee" label={t('apartment.brokerFee', 'Tivuch (Broker Fee)')} t={t} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- Group 3: Building & Location --- */}
                    {isGroupVisible([{ name: 'elevator', isCheckbox: true }, { name: 'parking', isCheckbox: true }, { name: 'tama38', isCheckbox: true }, { name: 'frontFacing', isCheckbox: true }, { name: 'rearFacing', isCheckbox: true }]) && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">{t('apartment.groups.building', 'Building & Location')}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {isVisible('elevator', true) && (
                                    <BooleanToggle control={control} name="elevator" label={t('apartment.elevator')} t={t} />
                                )}
                                {isVisible('parking', true) && (
                                    <BooleanToggle control={control} name="parking" label={t('apartment.parking')} t={t} />
                                )}
                                {isVisible('tama38', true) && (
                                    <BooleanToggle control={control} name="tama38" label={t('apartment.mamad')} t={t} />
                                )}
                                {isVisible('frontFacing', true) && (
                                    <BooleanToggle control={control} name="frontFacing" label={t('apartment.frontFacing', 'Front Facing (חזית)')} t={t} />
                                )}
                                {isVisible('rearFacing', true) && (
                                    <BooleanToggle control={control} name="rearFacing" label={t('apartment.rearFacing', 'Rear Facing (עורפית)')} t={t} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- Group 4: Apartment Features --- */}
                    {isGroupVisible([{ name: 'ac', isCheckbox: true }, { name: 'balcony', isCheckbox: true }, { name: 'furnished', isCheckbox: true }, { name: 'pets', isCheckbox: true }, { name: 'renovated', isCheckbox: true }]) && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">{t('apartment.groups.features', 'Apartment Features')}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {isVisible('ac', true) && (
                                    <BooleanToggle control={control} name="ac" label={t('apartment.ac')} t={t} />
                                )}
                                {isVisible('balcony', true) && (
                                    <BooleanToggle control={control} name="balcony" label={t('apartment.balcony')} t={t} />
                                )}
                                {isVisible('furnished', true) && (
                                    <BooleanToggle control={control} name="furnished" label={t('apartment.furnished')} t={t} />
                                )}
                                {isVisible('pets', true) && (
                                    <BooleanToggle control={control} name="pets" label={t('apartment.pets')} t={t} />
                                )}
                                {isVisible('renovated', true) && (
                                    <BooleanToggle control={control} name="renovated" label={t('apartment.renovated', 'Renovated (משופצת)')} t={t} />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                    {/* Active Custom Features (Extracted by AI or added manually) - moved out of details view so they are always visible if active */}
                    {Object.keys(customChecks).filter(id => customChecks[id]).length > 0 && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">{t('apartment.customFeaturesTitle', 'Additional Features')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {checklistTemplates
                                    .filter(template => customChecks[template.id])
                                    .map(template => (
                                        <div key={template.id} className="inline-flex items-center space-x-2 space-x-reverse bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                                            <span>{template.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => setCustomChecks(prev => ({ ...prev, [template.id]: false }))}
                                                className="text-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full"
                                                title={t('common.remove', 'הסר')}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                {/* The rest is also only visible in details step */}
                {formStep === 'details' && (
                    <>

                        {/* Add Custom Feature */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4 space-y-3">
                            <label className="block text-sm font-medium text-gray-700">{t('settings.addRequirementFromBank', 'הוסף מאפיין מהמאגר או צור חדש')}</label>
                            <div className="flex gap-2 relative">
                                <input
                                    type="text"
                                    list="custom-features-list"
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
                                <datalist id="custom-features-list">
                                    {checklistTemplates.map(t => (
                                        <option key={t.id} value={t.label} />
                                    ))}
                                </datalist>
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

                        {/* Notes Sector - Spanning full width */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mt-6">
                            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">{t('apartment.notes', 'Notes')}</h3>
                            <textarea
                                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y min-h-[100px]"
                                placeholder={t('apartment.notesPlaceholder', 'Any other details...')}
                                {...register('notes')}
                            />
                        </div>

                        {/* Source Data Presentation (Collapsible) */}
                        {watchSourceText && (
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSource(!showSource)}
                                    className="flex items-center justify-between w-full text-indigo-800 hover:text-indigo-900 transition-colors focus:outline-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="font-bold">{t('apartment.sourceText', 'Original Source Data (Additional)')}</h3>
                                    </div>
                                    <svg className={clsx("w-5 h-5 transition-transform", showSource ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showSource && (
                                    <div className="mt-4">
                                        {watchSourceText.startsWith('data:image/') ? (
                                            <div className="rounded-xl overflow-hidden border border-indigo-200">
                                                <img src={watchSourceText} alt="Original Ad" className="w-full max-h-96 object-contain bg-white" />
                                            </div>
                                        ) : (
                                            <textarea
                                                readOnly
                                                value={watchSourceText}
                                                className="w-full p-4 rounded-xl border border-indigo-200 bg-white text-gray-700 text-sm focus:outline-none resize-y min-h-[150px]"
                                            />
                                        )}
                                        <p className="text-xs text-indigo-600 mt-2">{t('apartment.sourceDisclaimer', 'This is the original text or image used to populate the form. You can cross-reference it here to ensure accuracy.')}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-8">
                    {submitting ? t('common.loading') : t('common.save')}
                </button>
            </form>
        </div>
    );
}

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Apartment, UserPreferences, CustomChecklistTemplate } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { HE } from '../../../lib/i18n';
import { Edit, Phone, MapPin, ExternalLink, Check, Eye, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, MessageSquare, Trash2, FileSignature } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export function ApartmentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [apartment, setApartment] = useState<Apartment | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [activeNoteField, setActiveNoteField] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const isMounted = useRef(true);

    const [checklistTemplates, setChecklistTemplates] = useState<CustomChecklistTemplate[]>([]);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        isMounted.current = true;

        const timeoutId = setTimeout(() => {
            if (isMounted.current && loading) {
                setLoading(false);
                toast.error('הטעינה נמשכת זמן רב מדי, נסה לרענן');
            }
        }, 10000);

        const unsubApartment = onSnapshot(doc(db, 'apartments', id), (docSnap) => {
            if (isMounted.current) {
                if (docSnap.exists()) {
                    setApartment({ id: docSnap.id, ...docSnap.data() } as Apartment);
                    setLoading(false);
                } else {
                    toast.error('הדירה לא נמצאה');
                    navigate('/');
                }
            }
        }, (error) => {
            console.error("Error fetching apartment:", error);
            if (isMounted.current) {
                toast.error(HE.common.error);
                setLoading(false);
            }
        });

        let unsubUser = () => { };
        if (user) {
            unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                if (isMounted.current && docSnap.exists()) {
                    const userData = docSnap.data();
                    if (userData.preferences) {
                        setPreferences(userData.preferences);
                    }
                    if (userData.checklistTemplates) {
                        setChecklistTemplates(userData.checklistTemplates);
                    }
                }
            });
        }

        return () => {
            isMounted.current = false;
            clearTimeout(timeoutId);
            unsubApartment();
            unsubUser();
        };
    }, [id, navigate, user]);

    const toggleField = async (field: keyof Apartment) => {
        if (!apartment || !id) return;
        const newValue = !apartment[field];

        try {
            await updateDoc(doc(db, 'apartments', id), { [field]: newValue });
        } catch (error) {
            console.error(error);
            toast.error(HE.common.error);
        }
    };

    const toggleCustomCheck = async (templateId: string) => {
        if (!apartment || !id) return;
        const currentVal = apartment.customChecks?.[templateId] || false;
        const newValue = !currentVal;

        try {
            const updatedChecks = {
                ...(apartment.customChecks || {}),
                [templateId]: newValue
            };
            await updateDoc(doc(db, 'apartments', id), { customChecks: updatedChecks });
        } catch (error) {
            console.error(error);
            toast.error(HE.common.error);
        }
    };

    // ... (saveNote unchanged)

    // ... (getMissingRequirements unchanged)

    // ... (renderBooleanItem unchanged)

    const handleDelete = async () => {
        if (!confirm(HE.common.confirmDelete)) return;
        if (!apartment || !id) return;

        try {
            await updateDoc(doc(db, 'apartments', id), {
                deleted: true,
                deletedAt: serverTimestamp()
            });
            toast.success(HE.common.deleteSuccess);
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error(HE.common.error);
        }
    };

    const renderCustomItem = (template: CustomChecklistTemplate) => {
        const isChecked = apartment?.customChecks?.[template.id] || false;

        return (
            <div key={template.id} className="mb-2">
                <div className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg transition-colors border-r-2 border-blue-200">
                    {/* Label */}
                    <button onClick={() => toggleCustomCheck(template.id)} className="flex-1 text-right mr-3">
                        <span className="text-gray-700 font-medium text-sm">{template.label}</span>
                    </button>

                    {/* Checkbox */}
                    <button onClick={() => toggleCustomCheck(template.id)}>
                        <div className={clsx(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300 bg-white"
                        )}>
                            {isChecked && <Check size={14} className="text-white" />}
                        </div>
                    </button>
                </div>
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
            toast.error('שגיאה בשמירת הערה');
            // Re-open if failed? Maybe just alert.
        }
    };

    // Matches logic...
    const getMissingRequirements = () => {
        if (!preferences || !apartment) return [];
        const missing: string[] = [];

        if (preferences.mustHaveElevator && !apartment.elevator) missing.push(HE.apartment.elevator);
        if (preferences.mustHaveParking && !apartment.parking) missing.push(HE.apartment.parking);
        if (preferences.mustHaveBalcony && !apartment.balcony) missing.push(HE.apartment.balcony);
        if (preferences.mustHaveAC && !apartment.ac) missing.push(HE.apartment.ac);
        if (preferences.mustHaveMamad && !apartment.tama38 && !apartment.notes?.includes('ממ"ד')) missing.push('ממ״ד');
        if (preferences.mustHavePets && !apartment.pets) missing.push(HE.apartment.pets);

        if (preferences.maxPrice && apartment.price > preferences.maxPrice) missing.push(`${HE.settings.maxPrice} (${preferences.maxPrice} ₪)`);
        if (preferences.minRooms && (apartment.rooms || 0) < preferences.minRooms) missing.push(`${HE.settings.minRooms} (${preferences.minRooms})`);

        return missing;
    };

    if (loading) return <div className="p-8 text-center">{HE.common.loading}</div>;
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
                    <button onClick={() => toggleField(field)} className="flex-1 text-right mr-3">
                        <span className="text-gray-700 font-medium text-sm">{label}</span>
                        {hasNote && !isEditingNote && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{hasNote}</div>
                        )}
                    </button>

                    {/* Checkbox */}
                    <button onClick={() => toggleField(field)}>
                        <div className={clsx(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            apartment[field] ? "bg-blue-500 border-blue-500" : "border-gray-300 bg-white"
                        )}>
                            {apartment[field] && <Check size={14} className="text-white" />}
                        </div>
                    </button>
                </div>

                {/* Note Edit Input */}
                {isEditingNote && (
                    <div className="mr-8 ml-2 mt-1 flex gap-2">
                        <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder="הוסף הערה..."
                            autoFocus
                        />
                        <button
                            onClick={() => saveNote(field)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                            שמור
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Summary Generator
    const generateSummary = () => {
        const positiveFields = [];
        const booleanFields: { key: keyof Apartment, label: string }[] = [
            { key: 'elevator', label: HE.apartment.elevator },
            { key: 'parking', label: 'חניה' },
            { key: 'balcony', label: 'מרפסת' },
            { key: 'pets', label: HE.apartment.pets },
            { key: 'furnished', label: HE.apartment.furnished },
            { key: 'tama38', label: HE.apartment.tama38 },
            { key: 'ac', label: 'מזגן' },
            { key: 'bars', label: 'סורגים' },
            { key: 'doubleGlazed', label: 'חלונות כפולים' },
            { key: 'naturalLight', label: 'אור טבעי' },
        ];

        booleanFields.forEach(({ key, label }) => {
            if (apartment[key]) {
                const note = apartment.checklistNotes?.[key];
                positiveFields.push(`${label}${note ? ` (${note})` : ''}`);
            }
        });

        return positiveFields;
    };

    return (
        <div className="pb-20">
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

                {/* Summary Accordion */}
                <div className="mb-4 border rounded-xl overflow-hidden">
                    <button
                        onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <span className="font-bold text-gray-700 text-sm">סיכום מהירה</span>
                        {isSummaryOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                    </button>
                    {isSummaryOpen && (
                        <div className="p-4 bg-white text-sm text-gray-700">
                            <h4 className="font-bold mb-2">יש בדירה:</h4>
                            <ul className="list-disc list-inside space-y-1 mb-4">
                                {generateSummary().map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                                {generateSummary().length === 0 && <li>עדיין לא סומנו פרטים</li>}
                            </ul>

                            {apartment.notes && (
                                <>
                                    <h4 className="font-bold mb-1">הערות כלליות:</h4>
                                    <p className="whitespace-pre-wrap">{apartment.notes}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Match Status Badge ... (same as before) */}
                {preferences && (
                    <div className={clsx(
                        "mb-4 p-3 rounded-xl border flex items-start gap-3",
                        isMatch ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
                    )}>
                        {isMatch ? (
                            <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                        ) : (
                            <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                            <div className="font-bold text-sm">
                                {isMatch ? HE.settings.match : HE.settings.mismatch}
                            </div>
                            {!isMatch && (
                                <div className="text-xs mt-1 opacity-90">
                                    {HE.settings.missing} {missingReqs.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                        <span className="block text-gray-500 text-xs">{HE.apartment.price}</span>
                        <span className="text-lg font-bold text-gray-900">{apartment.price.toLocaleString()} ₪</span>
                    </div>
                    {apartment.link && (
                        <a href={apartment.link} target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-3 rounded-xl text-center flex flex-col items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                            <ExternalLink size={20} className="mb-1" />
                            <span className="text-xs font-medium">{HE.apartment.link}</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Phases */}
            <div className="p-4 space-y-4">
                {/* Phase 1: Scouting */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <Eye className="text-blue-500" size={20} />
                        <h2 className="font-bold text-gray-800">{HE.apartment.phases?.scouting || 'פרטים יבשים'}</h2>
                    </div>
                    {apartment.notes ? (
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{apartment.notes}</p>
                    ) : (
                        <p className="text-gray-400 text-sm italic">אין הערות נוספות</p>
                    )}
                </div>

                {/* Phase 2: Phone Check */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <Phone className="text-green-500" size={20} />
                        <h2 className="font-bold text-gray-800">{HE.apartment.phases?.phone || 'בדיקה טלפונית'}</h2>
                    </div>
                    <div className="space-y-1">
                        {renderBooleanItem('elevator', HE.apartment.elevator)}
                        {renderBooleanItem('parking', 'חניה?')}
                        {renderBooleanItem('balcony', 'מרפסת?')}
                        {renderBooleanItem('pets', HE.apartment.pets)}
                        {renderBooleanItem('furnished', HE.apartment.furnished)}
                        {renderBooleanItem('brokerFee', HE.apartment.brokerFee)}
                        {renderBooleanItem('tama38', HE.apartment.tama38)}

                        {/* Custom Phone Items */}
                        {checklistTemplates.filter(t => t.phase === 'phone').map(t => renderCustomItem(t))}
                    </div>
                </div>

                {/* Phase 3: Visit Check */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <Check className="text-purple-500" size={20} />
                        <h2 className="font-bold text-gray-800">{HE.apartment.phases?.visit || 'ביקור בדירה'}</h2>
                    </div>
                    <div className="space-y-1">
                        {renderBooleanItem('naturalLight', HE.apartment.naturalLight)}
                        {renderBooleanItem('waterPressure', HE.apartment.waterPressure)}
                        {renderBooleanItem('noiseLevel', HE.apartment.noiseLevel)}
                        {renderBooleanItem('doubleGlazed', HE.apartment.doubleGlazed)}
                        {renderBooleanItem('mobileReception', HE.apartment.mobileReception)}
                        {renderBooleanItem('moldCheck', 'עובש / רטיבות?')}
                        {renderBooleanItem('bars', 'סורגים?')}
                        {renderBooleanItem('ac', 'מזגן בכל חדר?')}

                        {/* Custom Visit Items */}
                        {checklistTemplates.filter(t => t.phase === 'visit').map(t => renderCustomItem(t))}
                    </div>
                </div>

                {/* Phase 4: Signing */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <FileSignature className="text-orange-500" size={20} />
                        <h2 className="font-bold text-gray-800">{HE.apartment.phases?.signing || 'חוזה וחתימה'}</h2>
                    </div>
                    <div className="space-y-1">
                        {/* Custom Signing Items */}
                        {checklistTemplates.filter(t => t.phase === 'signing').map(t => renderCustomItem(t))}
                        {checklistTemplates.filter(t => t.phase === 'signing').length === 0 && (
                            <p className="text-gray-400 text-sm italic">לא הוגדרו שאלות לשלב זה. ניתן להוסיף בהגדרות.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

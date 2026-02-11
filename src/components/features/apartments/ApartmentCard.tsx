import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Apartment, ApartmentStatus } from '../../../types';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Timestamp } from 'firebase/firestore';

const statusColors: Record<ApartmentStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    called: 'bg-yellow-100 text-yellow-800',
    visited: 'bg-green-100 text-green-800',
    rejected: 'bg-gray-100 text-gray-800',
};

export function ApartmentCard({ apartment }: { apartment: Apartment }) {
    const { t } = useTranslation();
    const statusLabel = t(`apartment.status.${apartment.status}`);
    const thumbnail = apartment.images?.[0]?.url;

    // Format date
    let dateStr = '';
    if (apartment.createdAt) {
        // Handle Firestore Timestamp or standard Date
        const date = apartment.createdAt instanceof Timestamp ? apartment.createdAt.toDate() : new Date(apartment.createdAt);
        dateStr = new Intl.DateTimeFormat('he-IL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    const [isExpanded, setIsExpanded] = useState(false);

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

    const summaryItems = generateSummary();

    return (
        <div className="bg-white rounded-lg shadow-sm border mb-4 hover:shadow-md transition-shadow group overflow-hidden">
            <Link to={`/apartment/${apartment.id}`} className="block p-4">
                <div className="flex gap-4">
                    {thumbnail ? (
                        <img src={thumbnail} alt={apartment.address} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                    ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                            <Home className="text-gray-400" size={32} />
                        </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-1">
                                <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full', statusColors[apartment.status])}>
                                    {statusLabel}
                                </span>
                                <span className="text-lg font-bold text-gray-900 flex items-center">
                                    {apartment.price.toLocaleString()} ₪
                                </span>
                            </div>

                            <h3 className="text-base font-medium text-gray-900 truncate mb-1">{apartment.address}</h3>

                            <div className="flex items-center text-gray-500 text-sm">
                                <MapPin size={14} className="ml-1" />
                                <span className="truncate">{apartment.neighborhood}</span>
                            </div>
                        </div>

                        {/* Footer of card */}
                        <div className="flex items-center justify-end mt-2 text-xs text-gray-400">
                            {dateStr && (
                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                    <Calendar size={12} />
                                    <span>{t('apartment.createdAt')}{dateStr}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Accordion Toggle */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                }}
                className="w-full flex items-center justify-center p-1 bg-gray-50 hover:bg-gray-100 border-t transition-colors"
                aria-label={isExpanded ? "Collapse summary" : "Expand summary"}
            >
                {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>

            {isExpanded && (
                <div className="p-3 bg-gray-50 border-t text-sm text-gray-700">
                    <ul className="flex flex-wrap gap-2 mb-2">
                        {summaryItems.map((item, idx) => (
                            <li key={idx} className="bg-white px-2 py-1 rounded border text-xs text-gray-600">
                                {item}
                            </li>
                        ))}
                        {summaryItems.length === 0 && <li className="text-gray-400 text-xs italic">{t('apartment.noDetails')}</li>}
                    </ul>
                    {apartment.notes && (
                        <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                            <span className="font-bold">{t('apartment.notes')}: </span>
                            {apartment.notes}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

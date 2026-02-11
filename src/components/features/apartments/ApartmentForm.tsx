import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HE } from '../../../lib/i18n';
import { Input } from '../../common/Input';
import { Apartment } from '../../../types';

export function ApartmentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // "loading" for submission, "fetching" for initial data load
    const [submitting, setSubmitting] = useState(false);
    const [fetching, setFetching] = useState(!!id); // Start fetching if we have an ID

    // We use Partial<Apartment> for the form values
    const { register, handleSubmit, reset } = useForm<Partial<Apartment>>({
        defaultValues: {
            address: '',
            neighborhood: '',
            price: 0,
            notes: '',
            rooms: 0
        }
    });

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const loadApartment = async () => {
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
                        notes: data.notes
                    });
                }
            } catch (error) {
                console.error("Error loading apartment:", error);
                toast.error(HE.common.error);
                navigate('/');
            } finally {
                if (isMounted) setFetching(false);
            }
        };

        loadApartment();

        return () => {
            isMounted = false;
        };
    }, [id, reset, navigate]);

    const onSubmit = async (data: any) => {
        if (!user) return;
        setSubmitting(true);

        try {
            // Get user's current group ID
            let groupId = null;
            try {
                const userSnap = await getDoc(doc(db, 'users', user.uid));
                if (userSnap.exists()) {
                    groupId = userSnap.data().groupId || null;
                }
            } catch (e) {
                console.error("Error fetching user group", e);
            }

            const timestamp = serverTimestamp();
            const userInfo = {
                lastUpdatedBy: user.uid,
                lastUpdatedByName: user.displayName || user.email || 'Unknown',
                updatedAt: timestamp
            };

            if (id) {
                // Update existing
                const docRef = doc(db, 'apartments', id);
                await updateDoc(docRef, {
                    ...data,
                    price: Number(data.price),
                    rooms: Number(data.rooms),
                    ...userInfo
                });
                toast.success('הדירה עודכנה בהצלחה');
            } else {
                // Create new
                // For new apartments, we set createdBy AND lastUpdatedBy
                const newApartmentData = {
                    ...data,
                    price: Number(data.price),
                    rooms: Number(data.rooms),
                    userId: user.uid,
                    groupId: groupId,
                    status: 'new',
                    createdAt: timestamp,
                    createdBy: user.uid,
                    createdByName: user.displayName || user.email || 'Unknown',
                    ...userInfo,
                    ...userInfo,
                    // Init flags (default false if undefined, but form should handle this via register)
                    elevator: data.elevator || false,
                    parking: data.parking || false,
                    balcony: data.balcony || false,
                    ac: data.ac || false,
                    tama38: data.tama38 || false,
                    pets: data.pets || false,
                    furnished: data.furnished || false,
                    brokerFee: false, // Not in form yet
                };
                await addDoc(collection(db, 'apartments'), newApartmentData);
                toast.success('הדירה נוספה בהצלחה');
            }

            // Small delay for UX
            setTimeout(() => {
                navigate('/');
            }, 500);

        } catch (error) {
            console.error(error);
            toast.error(HE.common.error);
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
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6">{id ? HE.common.edit : HE.apartment.addNew}</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label={HE.apartment.address} {...register('address', { required: true })} />
                <Input label={HE.apartment.neighborhood} {...register('neighborhood', { required: true })} />
                <Input label={HE.apartment.price} type="number" {...register('price', { required: true })} />

                {/* Rooms Input */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">חדרים</label>
                    <input
                        type="number"
                        step="0.5"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        {...register('rooms')}
                    />
                </div>

                {/* Link Input */}
                <Input label={HE.apartment.link} type="url" {...register('link')} placeholder="https://..." />

                {/* Link Input */}
                <Input label={HE.apartment.link} type="url" {...register('link')} placeholder="https://..." />

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('elevator')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{HE.apartment.elevator}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('parking')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">חניה</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('balcony')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">מרפסת</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('ac')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">מזגן</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('tama38')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">ממ״ד / תמ״א</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('pets')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{HE.apartment.pets}</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <input type="checkbox" {...register('furnished')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-gray-700 font-medium mr-2">{HE.apartment.furnished}</span>
                    </label>
                </div>

                <div className="flex flex-col gap-1 mt-4">
                    <label className="text-sm font-medium text-gray-700">{HE.apartment.notes}</label>
                    <textarea
                        className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        rows={3}
                        {...register('notes')}
                    />
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-8">
                    {submitting ? HE.common.loading : HE.common.save}
                </button>
            </form>
        </div>
    );
}

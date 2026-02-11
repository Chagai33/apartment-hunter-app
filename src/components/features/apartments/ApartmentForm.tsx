import { useState, useEffect, useRef } from 'react';
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
    const [loading, setLoading] = useState(false);
    const isMounted = useRef(true);
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<Partial<Apartment>>();

    useEffect(() => {
        if (!id) return;

        const loadApartment = async () => {
            const docRef = doc(db, 'apartments', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && isMounted.current) {
                const data = docSnap.data() as Apartment;
                // Use reset to populate all fields including booleans and potential notes
                reset(data);
            }
        };
        loadApartment();

        return () => {
            isMounted.current = false;
        };
    }, [id, reset]);

    const onSubmit = async (data: any) => {
        if (!user) return;
        setLoading(true);
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

            const apartmentData = {
                ...data,
                price: Number(data.price),
                rooms: Number(data.rooms),
                userId: user.uid,
                groupId: groupId, // Save group ID
                status: 'new',
                createdAt: serverTimestamp(),
                // Initialize checklists
                elevator: false,
                parking: false,
                balcony: false,
                pets: false,
                furnished: false,
                brokerFee: false,
                tama38: false,
            };

            if (id) {
                const docRef = doc(db, 'apartments', id);
                await updateDoc(docRef, { ...data, price: Number(data.price), rooms: Number(data.rooms) });
                toast.success('הדירה עודכנה בהצלחה');
            } else {
                await addDoc(collection(db, 'apartments'), apartmentData);
                toast.success('הדירה נוספה בהצלחה');
            }

            // Artificial delay to ensure listener updates or navigation is smooth
            setTimeout(() => {
                navigate('/');
            }, 500);
        } catch (error) {
            console.error(error);
            toast.error(HE.common.error);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    return (
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6">{id ? HE.common.edit : HE.apartment.addNew}</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label={HE.apartment.address} {...register('address', { required: true })} />
                <Input label={HE.apartment.neighborhood} {...register('neighborhood', { required: true })} />
                <Input label={HE.apartment.price} type="number" {...register('price', { required: true })} />
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">{HE.apartment.notes}</label>
                    <textarea
                        className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        rows={3}
                        {...register('notes')}
                    />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-8">
                    {loading ? HE.common.loading : HE.common.save}
                </button>
            </form>
        </div>
    );
}

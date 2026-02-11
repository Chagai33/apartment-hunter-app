import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { HE } from '../../../lib/i18n';
import { clsx } from 'clsx';
import { Timestamp } from 'firebase/firestore';

interface Image {
    url: string;
    path: string;
    uploadedAt: Timestamp;
}

interface ImageUploaderProps {
    images: Image[];
    onImagesChange: (images: Image[]) => void;
    userId: string;
    apartmentId: string;
}

export function ImageUploader({ images, onImagesChange, userId, apartmentId }: ImageUploaderProps) {
    const { uploadImage, progress, uploading } = useStorage();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const timestamp = Date.now();
            const path = `users/${userId}/apartments/${apartmentId}/${timestamp}_${file.name}`;

            try {
                const url = await uploadImage(file, path);
                onImagesChange([
                    ...images,
                    {
                        url,
                        path,
                        uploadedAt: Timestamp.now(),
                    },
                ]);
            } catch (error) {
                console.error("Upload failed", error);
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{HE.gallery.upload}</h3>
                <span className="text-sm text-gray-500">{images.length} images</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {images.map((img, index) => (
                    <div key={img.url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                        <img src={img.url} alt="Apartment" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                        "aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors",
                        uploading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-2" />
                            <span className="text-xs">{Math.round(progress)}%</span>
                        </div>
                    ) : (
                        <>
                            <Camera size={24} className="mb-1" />
                            <span className="text-xs">{HE.gallery.upload}</span>
                        </>
                    )}
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}

import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export interface ImageItem {
    id: string; // unique local ID
    file?: File; // File object if it's new
    url: string; // Download URL or object URL for preview
    path?: string; // Storage path if it's an existing image
}

interface ImageUploaderProps {
    images: ImageItem[];
    onChange: (images: ImageItem[]) => void;
    maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 10 }: ImageUploaderProps) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [compressing, setCompressing] = useState(false);

    // Global Paste Listener
    useEffect(() => {
        const handleGlobalPaste = async (e: ClipboardEvent) => {
            // Check if we are focusing another input (like a text field)
            const activeElement = document.activeElement;
            const isInputFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
            // Only capture paste if not typing in a text field, or if it's specifically an image paste
            
            const clipboardItems = e.clipboardData?.items;
            if (!clipboardItems) return;

            const imageFiles: File[] = [];
            for (let i = 0; i < clipboardItems.length; i++) {
                if (clipboardItems[i].type.indexOf('image') !== -1) {
                    const file = clipboardItems[i].getAsFile();
                    if (file) {
                        isInputFocused && e.preventDefault(); // prevent pasting image blob into text area if somehow possible
                        imageFiles.push(file);
                    }
                }
            }

            if (imageFiles.length > 0) {
                await processFiles(imageFiles);
            }
        };

        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, [images, maxImages]); // Depend on current state

    const compressImage = async (file: File): Promise<File> => {
        const options = {
            maxSizeMB: 0.3, // 300KB
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: "image/jpeg"
        };
        try {
            return await imageCompression(file, options);
        } catch (error) {
            console.error("Compression error:", error);
            return file; // fallback to original on error
        }
    };

    const processFiles = async (files: File[]) => {
        if (images.length + files.length > maxImages) {
            toast.error(t('apartment.maxImagesError', { defaultValue: `ניתן להעלות עד ${maxImages} תמונות`, max: maxImages }));
            return;
        }

        setCompressing(true);
        try {
            const newImages: ImageItem[] = [];
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;
                
                const compressedFile = await compressImage(file);
                const objectUrl = URL.createObjectURL(compressedFile);
                
                newImages.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file: compressedFile,
                    url: objectUrl
                });
            }

            onChange([...images, ...newImages]);
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        } finally {
            setCompressing(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFiles(Array.from(e.target.files));
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (idToRemove: string) => {
        onChange(images.filter(img => img.id !== idToRemove));
    };

    const moveImage = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index > 0) {
            const newImages = [...images];
            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
            onChange(newImages);
        } else if (direction === 'right' && index < images.length - 1) {
            const newImages = [...images];
            [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
            onChange(newImages);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles(Array.from(e.dataTransfer.files));
        }
    };

    return (
        <div className="space-y-4">
            {/* Gallery / Preview Area */}
            {images.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
                    {images.map((img, idx) => (
                        <div key={img.id} className="relative group shrink-0 snap-center">
                            <img 
                                src={img.url} 
                                alt={`upload-${idx}`} 
                                className="w-32 h-32 object-cover rounded-2xl shadow-sm border border-gray-100"
                            />
                            
                            {/* Primary Badge */}
                            {idx === 0 && (
                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                    {t('apartment.mainImage', 'תאית')}
                                </div>
                            )}

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Sorting Controls */}
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                {idx > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => moveImage(idx, 'left')}
                                        className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                )}
                                {idx < images.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => moveImage(idx, 'right')}
                                        className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button / Dropzone */}
            {images.length < maxImages && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                        "w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all",
                        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-gray-100",
                        compressing && "opacity-50 pointer-events-none"
                    )}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileChange} 
                    />
                    
                    {compressing ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    ) : (
                        <>
                            <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 text-center">
                                {t('apartment.uploadImages', 'הוסף תמונות מהגלריה')}
                            </span>
                            <span className="text-xs text-gray-500 text-center mt-1">
                                {t('apartment.uploadHint', 'או הדבק ישירות ממסך המחשב (Ctrl+V)')}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

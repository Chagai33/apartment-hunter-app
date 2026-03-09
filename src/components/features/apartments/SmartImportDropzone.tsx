import { useState, useRef, ChangeEvent } from 'react';
import { clsx } from 'clsx';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';
import toast from 'react-hot-toast';

interface SmartImportDropzoneProps {
    onExtractSuccess: (data: any, originalSource: string) => void;
    onExtractStart: () => void;
    onExtractEnd: () => void;
    customCheckLabels?: string[];
}

export function SmartImportDropzone({ onExtractSuccess, onExtractStart, onExtractEnd, customCheckLabels = [] }: SmartImportDropzoneProps) {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const [textInput, setTextInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(t('apartment.import.errorNotImage', 'Please upload an image file.'));
            return;
        }

        onExtractStart();
        try {
            const options = {
                maxSizeMB: 0.5, // 500kb
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };

            const compressedFile = await imageCompression(file, options);
            const base64 = await fileToBase64(compressedFile);

            // Remove data URL prefix (e.g. data:image/jpeg;base64,)
            const base64Data = base64.split(',')[1];

            const analyzeFunc = httpsCallable(functions, 'analyzeApartmentData');
            const result = await analyzeFunc({
                imageBase64: base64Data,
                mimeType: compressedFile.type,
                customCheckLabels
            });

            onExtractSuccess(result.data, base64);
            toast.success(t('apartment.import.success', 'Data extracted successfully!'));
        } catch (error: any) {
            console.error("Extraction error:", error);
            handleError(error);
        } finally {
            onExtractEnd();
        }
    };

    const processText = async () => {
        if (!textInput.trim()) return;

        onExtractStart();
        try {
            const analyzeFunc = httpsCallable(functions, 'analyzeApartmentData');
            const result = await analyzeFunc({ text: textInput, customCheckLabels });

            onExtractSuccess(result.data, textInput);
            setTextInput(''); // Clear input on success
            toast.success(t('apartment.import.success', 'Data extracted successfully!'));
        } catch (error: any) {
            console.error("Extraction error:", error);
            handleError(error);
        } finally {
            onExtractEnd();
        }
    };

    const handleError = (error: any) => {
        if (error.code === 'functions/resource-exhausted') {
            toast.error(t('apartment.import.errorRateLimit', 'Daily import limit reached. Please try again tomorrow.'));
        } else {
            toast.error(t('apartment.import.errorGeneral', 'Failed to extract data. Please try manually.'));
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) await processFile(file);
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await processFile(file);
        // Reset input so the same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    return (
        <div className="mb-8 space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-1 rounded-2xl shadow-sm border border-blue-100/50">
                <div className="bg-white/60 p-4 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">{t('apartment.import.title', 'Smart Import (Beta)')}</h3>
                            <p className="text-sm text-gray-500">{t('apartment.import.subtitle', 'Paste text or upload a screenshot to auto-fill')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Text Input */}
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder={t('apartment.import.textPlaceholder', 'Paste ad text here...')}
                                className="w-full h-24 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                            />
                            <button
                                type="button"
                                onClick={processText}
                                disabled={!textInput.trim()}
                                className="px-4 py-2 bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 rounded-xl font-medium transition-colors disabled:opacity-50 text-sm"
                            >
                                {t('apartment.import.extractText', 'Extract from Text')}
                            </button>
                        </div>

                        {/* Image Dropzone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={clsx(
                                "h-full min-h-[120px] flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center",
                                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                            )}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-600">
                                {t('apartment.import.dragDrop', 'Click or drag image here')}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">
                                {t('apartment.import.maxSize', 'PNG, JPG up to 10MB')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

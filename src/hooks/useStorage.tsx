import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import imageCompression from 'browser-image-compression';

export function useStorage() {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const uploadImage = async (file: File, path: string) => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: 0.8,
                preserveExif: true,
            };

            const compressedFile = await imageCompression(file, options);
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, compressedFile);

            return new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setProgress(p);
                    },
                    (err) => {
                        setError(err.message);
                        setUploading(false);
                        reject(err);
                    },
                    async () => {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        setUrl(downloadUrl);
                        setUploading(false);
                        resolve(downloadUrl);
                    }
                );
            });
        } catch (err: any) {
            setError(err.message);
            setUploading(false);
            throw err;
        }
    };

    return { uploadImage, progress, error, url, uploading };
}

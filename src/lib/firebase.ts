import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBr_cTpmq9lR6pJ5XZSArV-6O3DjYQd_k8",
    authDomain: "home-finder-app-2024.firebaseapp.com",
    projectId: "home-finder-app-2024",
    storageBucket: "home-finder-app-2024.firebasestorage.app",
    messagingSenderId: "673067151097",
    appId: "1:673067151097:web:993ccd64618b77a3d53c28"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

enableIndexedDbPersistence(db).catch((err) => {
    console.error("Persistence error", err);
});

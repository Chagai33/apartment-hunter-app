import { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInAnonymously as firebaseSignInAnonymously,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    deleteUser,
    reauthenticateWithPopup,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { auth, db } from '../lib/firebase'; // Added db
import { doc, setDoc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInAnonymously: () => Promise<void>;
    signInWithGoogle: (mode?: 'login' | 'register') => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    reauthenticate: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);

            // NOTE: We REMOVED the auto-creation logic here. 
            // User creation is now explicit in register functions.
            if (user) {
                // Optional: Update lastSeen if the user exists
                // But avoid creating new docs blindly
            }
        });
        return unsubscribe;
    }, []);

    const signInAnonymously = async () => {
        await firebaseSignInAnonymously(auth);
    };

    // Updated: Accept mode to distinguish Intent
    const signInWithGoogle = async (mode: 'login' | 'register' = 'login') => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user doc exists
        const userRef = doc(db, 'users', user.uid);

        // We need to check existence. 
        // Since we can't use getDoc easily without importing it (and it might fail offline), 
        // we'll import it or try to set with merge: false if register?
        // Better: Try to read.
        // Let's import getDoc at the top first? Or just use what we have.
        // To be safe and simple:

        // Dynamic import or assume we have db access.
        // We need 'getDoc' from firebase/firestore
        const { getDoc } = await import('firebase/firestore');
        const userSnap = await getDoc(userRef);

        if (mode === 'login') {
            if (!userSnap.exists()) {
                // USER NOT REGISTERED
                await firebaseSignOut(auth); // Cleanup session
                throw new Error("User not registered");
            }
            // Update last seen
            await setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true });
        } else {
            // REGISTER MODE
            // If already exists, just login (or warn?) -> usually okay to just login
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    email: user.email,
                    createdAt: serverTimestamp(),
                    lastSeen: serverTimestamp(),
                });
            }
        }
    };

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    const signInWithEmail = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUpWithEmail = async (email: string, pass: string) => {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        // Explicitly create user doc
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
            email: email,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
        });
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const deleteAccount = async () => {
        if (!user) throw new Error("No user logged in");

        // Prevent deleting the Firestore document if Auth account deletion is likely to fail
        const lastSignInTime = new Date(user.metadata.lastSignInTime || 0).getTime();
        const now = Date.now();
        const minutesSinceSignIn = (now - lastSignInTime) / (1000 * 60);

        if (minutesSinceSignIn > 5) {
            const error = new Error("auth/requires-recent-login");
            (error as any).code = "auth/requires-recent-login";
            throw error;
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;

        await deleteDoc(userRef);

        try {
            await deleteUser(user);
        } catch (error: any) {
            // Restore document if auth deletion fails
            if (error.code === 'auth/requires-recent-login' && userData) {
                await setDoc(userRef, userData);
            }
            throw error;
        }
    };

    const reauthenticate = async (password?: string) => {
        if (!user) throw new Error("No user logged in");
        const providerId = user.providerData[0]?.providerId;

        if (providerId === 'google.com') {
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, provider);
        } else if (providerId === 'password') {
            if (!password) throw new Error("Password required");
            if (!user.email) throw new Error("User email not found");
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
        } else {
            throw new Error("Unsupported authentication provider");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInAnonymously, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout, deleteAccount, reauthenticate }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

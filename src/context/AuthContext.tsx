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
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../lib/firebase'; // Added db
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInAnonymously: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false); // Unblock UI immediately

            if (user) {
                // background: ensure user doc exists (upsert)
                // This avoids 'getDoc' failing when offline
                try {
                    const userRef = doc(db, 'users', user.uid);
                    await setDoc(userRef, {
                        email: user.email,
                        lastSeen: serverTimestamp(), // Useful for debug
                    }, { merge: true });

                    // Note: creation time is only set if doc doesn't exist? 
                    // merge: true preserves other fields.
                    // If we want 'createdAt' only on creation, we can't easily do it with simple merge 
                    // without getDoc, but 'createdAt' isn't critical strictly speaking if we use it for nothing.
                    // Or we can just set email.
                } catch (error) {
                    console.error("BG User Sync Error:", error);
                }
            }
        });
        return unsubscribe;
    }, []);

    const signInAnonymously = async () => {
        await firebaseSignInAnonymously(auth);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    const signInWithEmail = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUpWithEmail = async (email: string, pass: string) => {
        await createUserWithEmailAndPassword(auth, email, pass);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInAnonymously, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function AppShell({ children }: { children: ReactNode }) {
    useAccessibility();

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center" dir="rtl">
            <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative flex flex-col">
                <Navbar />
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </div>
            <Toaster position="bottom-center" />
        </div>
    );
}

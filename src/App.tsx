import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './components/features/auth/LoginPage';
import { ApartmentList } from './components/features/apartments/ApartmentList';
import { ApartmentForm } from './components/features/apartments/ApartmentForm';
import { ApartmentDetails } from './components/features/apartments/ApartmentDetails';
import { ApartmentTrash } from './components/features/apartments/ApartmentTrash';
import { PreferencesForm } from './components/features/preferences/PreferencesForm';
import { GroupManagement } from './components/features/groups/GroupManagement';
import { PrivacyPolicy } from './components/features/legal/PrivacyPolicy';
import { TermsOfService } from './components/features/legal/TermsOfService';
import { AccessibilityStatement } from './components/features/legal/AccessibilityStatement';
import { HE } from './lib/i18n';

function AuthGuard({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-10 text-center">{HE.common.loading}</div>;
    if (!user) return <Navigate to="/login" replace />;

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>
                    <AppShell>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/" element={
                                <AuthGuard>
                                    <ApartmentList />
                                </AuthGuard>
                            } />
                            <Route path="/add" element={
                                <AuthGuard>
                                    <ApartmentForm />
                                </AuthGuard>
                            } />
                            <Route path="/apartment/:id" element={
                                <AuthGuard>
                                    <ApartmentDetails />
                                </AuthGuard>
                            } />
                            <Route path="/edit/:id" element={
                                <AuthGuard>
                                    <ApartmentForm />
                                </AuthGuard>
                            } />
                            <Route path="/trash" element={
                                <AuthGuard>
                                    <ApartmentTrash />
                                </AuthGuard>
                            } />
                            <Route path="/settings" element={
                                <AuthGuard>
                                    <PreferencesForm />
                                </AuthGuard>
                            } />
                            <Route path="/groups" element={
                                <AuthGuard>
                                    <GroupManagement />
                                </AuthGuard>
                            } />
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsOfService />} />
                            <Route path="/accessibility" element={<AccessibilityStatement />} />
                        </Routes>
                    </AppShell>
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
}

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider, useGroup } from './context/GroupContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './components/features/auth/LoginPage';
import { LandingPage } from './components/layout/LandingPage';
import { UserGuide } from './components/layout/UserGuide';
import { ApartmentList } from './components/features/apartments/ApartmentList';
import { ApartmentForm } from './components/features/apartments/ApartmentForm';
import { ApartmentDetails } from './components/features/apartments/ApartmentDetails';
import { OnboardingPage } from './components/features/auth/OnboardingPage';

import { GroupManagement } from './components/features/groups/GroupManagement';
import { PrivacyPolicy } from './components/features/legal/PrivacyPolicy';
import { TermsOfService } from './components/features/legal/TermsOfService';
import { AccessibilityStatement } from './components/features/legal/AccessibilityStatement';
import { WorkspaceSettings } from './components/features/groups/WorkspaceSettings';

import { useTranslation } from 'react-i18next'; // Add import

function AuthGuard({ children }: { children: JSX.Element }) {
    const { user, loading: authLoading } = useAuth();
    const { groups, loading: groupsLoading } = useGroup();
    const { t } = useTranslation();
    const location = useLocation();

    if (authLoading || (user && groupsLoading)) {
        return <div className="p-10 text-center">{t('common.loading')}</div>;
    }

    if (!user) return <Navigate to="/login" replace />;

    // Intercept Onboarding Flow
    if (groups.length === 0 && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    // Prevent navigating to onboarding if already set up
    if (groups.length > 0 && location.pathname === '/onboarding') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>
                    <GroupProvider>
                        <AppShell>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/" element={<LandingPage />} />
                                <Route path="/guide" element={<UserGuide />} />

                                <Route path="/onboarding" element={
                                    <AuthGuard>
                                        <OnboardingPage />
                                    </AuthGuard>
                                } />

                                <Route path="/dashboard" element={
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
                                    <Navigate to="/workspace-settings" replace />
                                } />

                                <Route path="/settings" element={
                                    <Navigate to="/workspace-settings" replace />
                                } />
                                <Route path="/workspace-settings" element={
                                    <AuthGuard>
                                        <WorkspaceSettings />
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
                    </GroupProvider>
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
}

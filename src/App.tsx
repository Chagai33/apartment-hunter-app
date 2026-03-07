import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider, useGroup } from './context/GroupContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './components/features/auth/LoginPage';
import { LandingPage } from './components/layout/LandingPage';
import { UserGuide } from './components/layout/UserGuide';
import { PrivacyPolicy } from './components/features/legal/PrivacyPolicy';
import { TermsOfService } from './components/features/legal/TermsOfService';
import { AccessibilityStatement } from './components/features/legal/AccessibilityStatement';
import { useTranslation } from 'react-i18next';

// Lazy-loaded Authenticated Components
const ApartmentList = lazy(() => import('./components/features/apartments/ApartmentList').then(module => ({ default: module.ApartmentList })));
const ApartmentForm = lazy(() => import('./components/features/apartments/ApartmentForm').then(module => ({ default: module.ApartmentForm })));
const ApartmentDetails = lazy(() => import('./components/features/apartments/ApartmentDetails').then(module => ({ default: module.ApartmentDetails })));
const OnboardingPage = lazy(() => import('./components/features/auth/OnboardingPage').then(module => ({ default: module.OnboardingPage })));
const GroupManagement = lazy(() => import('./components/features/groups/GroupManagement').then(module => ({ default: module.GroupManagement })));
const WorkspaceSettings = lazy(() => import('./components/features/groups/WorkspaceSettings').then(module => ({ default: module.WorkspaceSettings })));

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
                            <Suspense fallback={<div className="p-10 text-center">Loading app...</div>}>
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
                            </Suspense>
                        </AppShell>
                    </GroupProvider>
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
}

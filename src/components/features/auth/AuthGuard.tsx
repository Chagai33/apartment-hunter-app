import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="flex items-center justify-center flex-1">
                <p className="text-gray-500">{t('common.loading')}</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

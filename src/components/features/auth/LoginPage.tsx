import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Input } from '../../common/Input';
import { clsx } from 'clsx';
import { PreAuthDisclosure } from '../../auth/PreAuthDisclosure';

type AuthMode = 'login' | 'register' | 'reset';

export function LoginPage() {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showGoogleDisclosure, setShowGoogleDisclosure] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            // Use current mode (login/register) to determine intent
            // If user is in 'reset' mode, default to 'login' (though button is hidden in reset)
            const intent = mode === 'register' ? 'register' : 'login';
            await signInWithGoogle(intent);
            navigate('/dashboard');
        } catch (error: any) {
            console.error(error);
            if (error.message === "User not registered") {
                toast.error("אינך רשום במערכת. הועברת להרשמה.");
                setMode('register');
            } else {
                toast.error(t('common.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            if (mode === 'reset') {
                await resetPassword(email);
                toast.success(t('auth.resetEmailSent'));
                setMode('login');
            } else if (mode === 'register') {
                await signUpWithEmail(email, password);
                toast.success(t('auth.registerSuccess') || 'Registration successful');
                navigate('/dashboard');
            } else {
                await signInWithEmail(email, password);
                navigate('/dashboard');
            }
        } catch (error: any) {
            console.error(error);
            let msg = t('common.error');
            if (error.code === 'auth/email-already-in-use') msg = 'המייל כבר קיים במערכת';
            else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = 'המייל או הסיסמה שגויים';
            else if (error.code === 'auth/user-not-found') msg = 'משתמש לא נמצא. אנא הירשם.';
            else if (error.code === 'auth/invalid-email') msg = 'כתובת מייל לא תקינה';
            else if (error.code === 'auth/weak-password') msg = 'סיסמה חלשה מדי (מינימום 6 תווים)';
            else if (error.code === 'auth/configuration-not-found') msg = 'תקלת קונפיגורציה ב-Firebase';

            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {mode === 'login' && t('auth.loginWithEmail')}
                        {mode === 'register' && t('auth.register')}
                        {mode === 'reset' && t('auth.resetPassword')}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {mode === 'reset' ? t('auth.enterEmailToReset', 'Enter email to reset') : t('auth.loginSubtitle')}
                    </p>
                </div>

                {/* Tabs */}
                {mode !== 'reset' && !showGoogleDisclosure && (
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                        <button
                            onClick={() => setMode('login')}
                            className={clsx(
                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                mode === 'login' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {t('auth.loginWithEmail')}
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={clsx(
                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                mode === 'register' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {t('auth.register')}
                        </button>
                    </div>
                )}

                {showGoogleDisclosure ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <PreAuthDisclosure
                            onConfirm={handleGoogleLogin}
                            isLoading={loading}
                        />
                        <button
                            onClick={() => setShowGoogleDisclosure(false)}
                            className="w-full mt-4 text-gray-500 text-sm hover:text-gray-800 font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label={t('auth.email')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('auth.emailPlaceholder')}
                                required
                            />

                            {mode !== 'reset' && (
                                <div>
                                    <Input
                                        label={t('auth.password')}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('auth.passwordPlaceholder')}
                                        required
                                    />
                                    {mode === 'login' && (
                                        <div className="flex justify-end mt-1">
                                            <button
                                                type="button"
                                                onClick={() => setMode('reset')}
                                                className="text-xs text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                            >
                                                {t('auth.forgotPassword')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                            >
                                {loading ? t('common.loading') : (
                                    mode === 'login' ? t('auth.loginWithEmail') :
                                        mode === 'register' ? t('auth.register') :
                                            t('auth.resetPassword')
                                )}
                            </button>
                        </form>

                        {mode === 'reset' && (
                            <button
                                onClick={() => setMode('login')}
                                className="w-full mt-4 text-gray-500 text-sm hover:text-gray-800 font-medium"
                            >
                                {t('auth.backToLogin')}
                            </button>
                        )}

                        <div className="relative flex py-6 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">{t('auth.or')}</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <button
                            onClick={() => setShowGoogleDisclosure(true)}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 min-h-[48px]"
                            aria-label={t('auth.loginGoogle')}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            {t('auth.loginGoogle')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

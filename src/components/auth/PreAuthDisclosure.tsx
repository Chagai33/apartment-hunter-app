import { useTranslation } from 'react-i18next';
import { Shield, User, Mail } from 'lucide-react';
import { LoginButton } from './LoginButton';

interface PreAuthDisclosureProps {
    onConfirm: () => void;
    isLoading: boolean;
}

export function PreAuthDisclosure({ onConfirm, isLoading }: PreAuthDisclosureProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex gap-3 mb-2">
                    <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                    <h3 className="font-semibold text-blue-900 text-sm">
                        {t('auth.preAuth.title')}
                    </h3>
                </div>
                <p className="text-sm text-blue-800/80 leading-relaxed">
                    {t('auth.preAuth.description')}
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
                    <div className="p-2 bg-gray-50 rounded-full">
                        <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">{t('auth.preAuth.scopeProfile')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
                    <div className="p-2 bg-gray-50 rounded-full">
                        <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">{t('auth.preAuth.scopeEmail')}</p>
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-500 leading-relaxed">
                {t('auth.preAuth.reason')}
            </div>

            <div className="pt-2">
                <LoginButton onClick={onConfirm} isLoading={isLoading} />
            </div>
        </div>
    );
}

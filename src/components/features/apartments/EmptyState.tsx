import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroup } from '../../../context/GroupContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export function EmptyState() {
    const { t } = useTranslation();
    const { groups, createGroup } = useGroup();
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const handleCreateGroup = async () => {
        setCreating(true);
        try {
            await createGroup("המרחב האישי שלי", true); // Create default group
            // Navigate directly to add apartment page
            navigate('/add');
        } catch (error) {
            console.error(error);
            toast.error(t('common.error', 'Something went wrong'));
            setCreating(false);
        }
    };

    if (groups.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="bg-blue-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🚀</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('dashboard.welcome', 'Welcome to Apartment Hunter')}</h3>
                <p className="text-gray-500 mb-6">{t('dashboard.noGroups', 'To get started, let\'s add your first apartment.')}</p>
                <button
                    onClick={handleCreateGroup}
                    disabled={creating}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                    {creating ? (
                        t('common.loading', 'Loading...')
                    ) : (
                        <>
                            <Plus size={20} />
                            {t('dashboard.createPersonal', 'Add First Apartment')}
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="text-center py-12">
            <div className="bg-gray-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🏠</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('dashboard.emptyTitle')}</h3>
            <p className="text-gray-500 mb-6">{t('dashboard.emptySubtitle')}</p>
            <Link to="/add" className="text-blue-600 font-medium hover:underline">
                {t('dashboard.cta')}
            </Link>
        </div>
    );
}

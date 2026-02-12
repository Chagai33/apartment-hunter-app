import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Users, HeartHandshake, ArrowRight, ArrowLeft } from 'lucide-react';


export function LandingPage() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();

    const isRtl = i18n.dir() === 'rtl';

    // Removed redirect effect to allow landing page viewing

    const features = [
        {
            icon: <Building2 className="w-8 h-8 text-blue-600" />,
            title: t('landing.features.single.title'),
            desc: t('landing.features.single.desc')
        },
        {
            icon: <Users className="w-8 h-8 text-purple-600" />,
            title: t('landing.features.couples.title'),
            desc: t('landing.features.couples.desc')
        },
        {
            icon: <HeartHandshake className="w-8 h-8 text-pink-600" />,
            title: t('landing.features.roommates.title'),
            desc: t('landing.features.roommates.desc')
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <main>
                {/* Hero Section */}
                <section className="px-6 pt-12 pb-6 text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                        {t('landing.heroTitle')}
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                        {t('landing.heroSubtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to={user ? "/dashboard" : "/login"}
                            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-1"
                        >
                            {user ? (t('nav.dashboard') || 'ללוח הדירות') : t('landing.ctaStart')}
                            {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                        </Link>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="px-6 py-8 bg-white">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="p-8 rounded-3xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                            >
                                <div className="mb-6 p-4 bg-white rounded-2xl inline-block shadow-sm group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Preview / Visual */}
                <section className="px-6 pb-20 max-w-6xl mx-auto">
                    <div className="bg-gray-900 rounded-3xl p-4 md:p-8 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="bg-gray-800 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-gray-700">
                            <div className="text-gray-500 font-medium">App Preview Placeholder</div>
                            {/* Ideally replace with an actual screenshot image */}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home, CheckCircle, Smartphone, Users, Briefcase, XCircle, Phone, Search } from 'lucide-react';

export function UserGuide() {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-12 font-sans">

            {/* Intro */}
            <section className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
                    <Home size={24} />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                    {isRtl ? 'המדריך המלא ל-Apartment Hunter' : 'The Complete Apartment Hunter Guide'}
                </h1>
                <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    {isRtl
                        ? 'המערכת נועדה להפוך את תהליך חיפוש הדירה מכאוס מוחלט לתהליך מסודר, חכם ושיתופי. לא משנה אם אתם זוג שמחפש בית או מתווך שמנהל עשרות נכסים – הנה איך להוציא מהכלי הזה את המקסימום.'
                        : 'This tool is designed to turn the chaos of apartment hunting into an organized, smart, and collaborative process. Whether you are a couple looking for a home or an agent managing detailed properties – here is how to get the max out of this tool.'}
                </p>
            </section>

            {/* Part A: Seekers */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm border border-gray-100">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {isRtl ? "חלק א': למחפשי דירות" : "Part A: For Apartment Seekers"}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {isRtl ? "(יחידים, זוגות ושותפים)" : "(Singles, Couples, and Roommates)"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-8">
                    {/* Step 1 */}
                    <article>
                        <h3 className="flex items-start gap-3 text-base font-bold text-gray-900 mb-2">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold mt-0.5">1</span>
                            <div>
                                {isRtl ? 'הצעד הראשון: מקימים מפקדה (Groups)' : 'Step 1: Set Up Headquarters (Groups)'}
                            </div>
                        </h3>
                        <div className="mr-9 ml-9 md:mr-9 md:ml-9 space-y-2 text-sm text-gray-600 leading-relaxed">
                            <p className="mb-2">
                                {isRtl ? 'במקום לשלוח לינקים בוואטסאפ שנעלמים בהיסטוריה, אתם מנהלים הכל במקום אחד משותף.' : 'Instead of losing links in WhatsApp history, you manage everything in one shared place.'}
                            </p>
                            <ul className="list-disc list-inside space-y-1 marker:text-gray-300">
                                <li><span className="font-medium text-gray-900">{isRtl ? 'יצירה:' : 'Create:'}</span> {isRtl ? 'במסך הראשי, לחצו על "צור קבוצה חדשה" ותנו לה שם (למשל: "הדירה של דני ומאיה").' : 'In the main screen, click "Create New Group" and name it.'}</li>
                                <li><span className="font-medium text-gray-900">{isRtl ? 'הזמנה:' : 'Invite:'}</span> {isRtl ? 'מיד עם היצירה תקבלו קוד הזמנה (בן 6 תווים). שלחו את הקוד הזה לבן/בת הזוג או לשותפים.' : 'Get the 6-character invite code and send it to your partners.'}</li>
                                <li><span className="font-medium text-gray-900">{isRtl ? 'סנכרון:' : 'Sync:'}</span> {isRtl ? 'ברגע שהם מזינים את הקוד אצלם – הטלפונים שלכם מסונכרנים. כל דירה שמישהו מוסיף או מעדכן מופיעה מיד אצל כולם.' : 'Once they enter the code, your phones are synced. Every update appears instantly for everyone.'}</li>
                            </ul>
                        </div>
                    </article>

                    {/* Step 2 */}
                    <article>
                        <h3 className="flex items-start gap-3 text-base font-bold text-gray-900 mb-2">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold mt-0.5">2</span>
                            <div>
                                {isRtl ? 'תיאום ציפיות: הגדרות (Preferences)' : 'Step 2: Define Preferences'}
                            </div>
                        </h3>
                        <div className="mr-9 ml-9 md:mr-9 md:ml-9 space-y-2 text-sm text-gray-600 leading-relaxed">
                            <p className="mb-2">
                                {isRtl ? 'לפני שמתחילים, מוודאים שכולם "באותו ראש" לגבי מה מחפשים.' : 'Ensure everyone is aligned on what you are looking for before starting.'}
                            </p>
                            <p>
                                {isRtl ? 'כנסו ללשונית הגדרות (Settings) בתוך הקבוצה שלכם.' : 'Go to the Settings tab inside your group.'}
                            </p>
                            <ul className="list-disc list-inside space-y-1 marker:text-gray-300">
                                <li><span className="font-medium text-gray-900">{isRtl ? 'תקציב וחדרים:' : 'Budget & Rooms:'}</span> {isRtl ? 'הגדירו את הקווים האדומים (מחיר מקסימלי, מינימום חדרים).' : 'Define red lines (max price, min rooms).'}</li>
                                <li><span className="font-medium text-gray-900">{isRtl ? 'ה"מאסטים" (Must Haves):' : 'Must Haves:'}</span> {isRtl ? 'זה הכוח האמיתי. סמנו מהו "יהרג ובל יעבור" עבורכם: חייב מעלית? חייב ממ"ד? חייב חיות מחמד?' : 'Your deal-breakers. Elevator? Shelter? Pets?'}</li>
                            </ul>
                            <p className="mt-2 text-blue-600 bg-blue-50 p-3 rounded-lg text-xs">
                                <strong>{isRtl ? 'למה זה טוב? ' : 'Why? '}</strong>
                                {isRtl ? 'המערכת תדע לסמן לכם בהמשך אילו דירות עומדות בדרישות ואילו לא, בלי שתצטרכו לקרוא כל מודעה פעמיים.' : 'The system will highlight matching apartments so you don\'t have to read every ad twice.'}
                            </p>
                        </div>
                    </article>

                    {/* Step 3 */}
                    <article>
                        <h3 className="flex items-start gap-3 text-base font-bold text-gray-900 mb-2">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold mt-0.5">3</span>
                            <div>
                                {isRtl ? 'העבודה השוטפת: ניהול "חיי הדירה"' : 'Step 3: Manage Flow'}
                            </div>
                        </h3>
                        <div className="mr-9 ml-9 md:mr-9 md:ml-9 text-sm text-gray-600 space-y-3">
                            <p>{isRtl ? 'מצאתם מודעה ביד2/פייסבוק? אל תשמרו במועדפים בדפדפן. הכניסו אותה לאפליקציה.' : 'Found an ad? Don\'t save in browser bookmarks. Add it to the app.'}</p>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded h-fit"><Search size={14} /></div>
                                    <div>
                                        <span className="font-bold text-gray-900 block text-xs mb-0.5">New</span>
                                        <span className="text-xs">{isRtl ? 'ראיתם מודעה מעניינת? שמרו אותה כאן כדי לא לשכוח.' : 'Saw an ad? Save it here.'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                    <div className="p-1.5 bg-yellow-100 text-yellow-700 rounded h-fit"><Phone size={14} /></div>
                                    <div>
                                        <span className="font-bold text-gray-900 block text-xs mb-0.5">Called</span>
                                        <span className="text-xs">{isRtl ? 'דיברתם עם בעל הבית? עדכנו פרטים שגיליתם בשיחה (ועד בית, תאריך).' : 'Spoke to owner? Update details.'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                    <div className="p-1.5 bg-green-100 text-green-700 rounded h-fit"><CheckCircle size={14} /></div>
                                    <div>
                                        <span className="font-bold text-gray-900 block text-xs mb-0.5">Visited</span>
                                        <span className="text-xs">{isRtl ? 'הלכתם לראות? צלמו תמונות והעלו, וכתבו הערות.' : 'Visited? Upload photos and notes.'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                    <div className="p-1.5 bg-gray-200 text-gray-600 rounded h-fit"><XCircle size={14} /></div>
                                    <div>
                                        <span className="font-bold text-gray-900 block text-xs mb-0.5">Rejected</span>
                                        <span className="text-xs">{isRtl ? 'לא מתאים? העבירו לסטטוס "נדחתה". אם תיתקלו במודעה שוב, תדעו שכבר בדקתם.' : 'Not relevant? Mark rejected so you know you already checked it.'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Step 4 */}
                    <article>
                        <h3 className="flex items-start gap-3 text-base font-bold text-gray-900 mb-2">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold mt-0.5">4</span>
                            <div>
                                {isRtl ? 'המוח שלכם בשטח: הצ\'ק-ליסט החכם' : 'Step 4: Smart Checklist Manager'}
                            </div>
                        </h3>
                        <div className="mr-9 ml-9 md:mr-9 md:ml-9 text-sm text-gray-600 space-y-2">
                            <p>{isRtl ? 'כדי לא להגיע לדירה ולשכוח לבדוק דברים קריטיים, בנינו עבורכם את ה-Checklist Manager.' : 'Don\'t forget critical checks.'}</p>
                            <p className="text-xs text-gray-500">{isRtl ? 'כנסו להגדרות הקבוצה -> לשונית Checklist.' : 'Go to Group Settings -> Checklist.'}</p>

                            <div className="border-r-2 border-gray-200 pr-3 mr-1 space-y-3">
                                <div>
                                    <span className="text-gray-900 font-bold text-xs flex items-center gap-1.5 mb-1"><Smartphone size={12} /> Phone</span>
                                    <p className="text-xs text-gray-500">{isRtl ? 'שאלות לשיחה הראשונה (למשל: "האם המחיר גמיש?", "האם הדירה מרוהטת?").' : 'Questions for the call (Flexible price? Furnished?)'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-900 font-bold text-xs flex items-center gap-1.5 mb-1"><CheckCircle size={12} /> Visit</span>
                                    <p className="text-xs text-gray-500">{isRtl ? 'שאלות לסיור (למשל: "לבדוק זרם במקלחת", "רעש מהרחוב").' : 'Questions for the visit (Water pressure? Noise?)'}</p>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            {/* Part B: Agents */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-purple-600 shadow-sm border border-gray-100">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {isRtl ? "חלק ב': מדריך למתווכים" : "Part B: For Real Agents"}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {isRtl ? "(Agents)" : "(Agents)"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-8">
                    <article className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold mt-1">1</div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                {isRtl ? 'אסטרטגיית "קבוצה לכל לקוח"' : '"Group per Client" Strategy'}
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{isRtl ? 'במקום לנהל רשימות אקסל, השתמשו במנגנון הקבוצות.' : 'Use groups instead of Excel sheets.'}</p>
                                <ul className="list-disc list-inside text-xs space-y-1 mt-2 text-gray-500">
                                    <li>{isRtl ? 'פתחו קבוצה ללקוח והזמינו אותו.' : 'Create a group and invite the client.'}</li>
                                    <li>{isRtl ? 'הלקוח רואה עבודה בזמן אמת ומגיב מיידית.' : 'Client sees real-time work and reacts instantly.'}</li>
                                </ul>
                            </div>
                        </div>
                    </article>

                    <article className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold mt-1">2</div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                {isRtl ? 'פרופיל לקוח ומשפך שיווקי' : 'Client Profile & Pipeline'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                                {isRtl ? 'הגדירו Preferences ללקוח לסינון מדויק. נהלו את ה-Pipeline בעזרת הסטטוסים:' : 'Set preferences for accurate filtering. Manage pipeline with statuses:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">New</span>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Called</span>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Visited</span>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Rejected</span>
                            </div>
                        </div>
                    </article>

                    <article className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold mt-1">3</div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                {isRtl ? 'סטנדרטיזציה (Checklists) וסל מיחזור (Trash)' : 'Standardization & Trash'}
                            </h3>
                            <div className="text-sm text-gray-600 space-y-2">
                                <p>{isRtl ? 'צרו שאלות קבועות לשלבי החתימה (Signing) והביקור. זה מונע תקלות.' : 'Create standard questions for signing and visits.'}</p>
                                <p className="text-xs bg-gray-50 p-2 rounded">
                                    <strong>Trash:</strong> {isRtl ? 'מחקתם בטעות? שחזרו נכסים בקלות דרך ה-Workspace Settings.' : 'Deleted by mistake? Restore via Workspace Settings.'}
                                </p>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <div className="flex justify-center pt-6 pb-12">
                <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-gray-900 transition-all shadow hover:shadow-lg"
                >
                    {t('landing.ctaStart')}
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Link>
            </div>

        </div>
    );
}

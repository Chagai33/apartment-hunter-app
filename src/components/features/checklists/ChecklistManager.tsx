import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useGroup } from '../../../context/GroupContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { CustomChecklistTemplate } from '../../../types';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

export function ChecklistManager() {
    const { user } = useAuth();
    const { activeGroupId } = useGroup();
    const { t } = useTranslation();

    const [checklistTemplates, setChecklistTemplates] = useState<CustomChecklistTemplate[]>([]);
    const [newTemplateLabel, setNewTemplateLabel] = useState('');
    const [newTemplatePhase, setNewTemplatePhase] = useState<'scouting' | 'phone' | 'visit' | 'signing'>('phone');

    // Load templates
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                let docRef;
                if (activeGroupId) {
                    docRef = doc(db, 'groups', activeGroupId);
                } else {
                    docRef = doc(db, 'users', user.uid);
                }

                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.checklistTemplates) {
                        setChecklistTemplates(data.checklistTemplates);
                    } else {
                        setChecklistTemplates([]);
                    }
                }
            } catch (error) {
                console.error("Error loading checklist templates:", error);
            }
        };
        loadData();
    }, [user, activeGroupId]);

    const saveTemplates = async (newTemplates: CustomChecklistTemplate[]) => {
        if (!user) return;
        try {
            let docRef;
            if (activeGroupId) {
                docRef = doc(db, 'groups', activeGroupId);
            } else {
                docRef = doc(db, 'users', user.uid);
            }

            await updateDoc(docRef, {
                checklistTemplates: newTemplates
            });
            setChecklistTemplates(newTemplates);
            toast.success(t('settings.saveSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const addTemplate = async () => {
        if (!newTemplateLabel.trim()) return;

        const newTemplate: CustomChecklistTemplate = {
            id: Date.now().toString(),
            label: newTemplateLabel,
            phase: newTemplatePhase
        };

        const updatedTemplates = [...checklistTemplates, newTemplate];
        await saveTemplates(updatedTemplates);
        setNewTemplateLabel('');
    };

    const removeTemplate = async (id: string) => {
        const updatedTemplates = checklistTemplates.filter(t => t.id !== id);
        await saveTemplates(updatedTemplates);
    };

    return (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h2 className="font-bold text-gray-800 mb-3 border-b pb-2">{t('settings.customChecklist')}</h2>
            <p className="text-xs text-gray-500 mb-6">{t('settings.customChecklistSubtitle')}</p>

            <div className="flex flex-col gap-3 mb-6 bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-700">{t('settings.addNewQuestion')}</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={newTemplateLabel}
                        onChange={(e) => setNewTemplateLabel(e.target.value)}
                        placeholder={t('settings.newQuestionPlaceholder')}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <select
                        value={newTemplatePhase}
                        onChange={(e) => setNewTemplatePhase(e.target.value as any)}
                        className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="phone">{t('apartment.phases.phone')}</option>
                        <option value="visit">{t('apartment.phases.visit')}</option>
                        <option value="signing">{t('apartment.phases.signing')}</option>
                    </select>
                    <button
                        onClick={addTemplate}
                        disabled={!newTemplateLabel.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={16} />
                        {t('common.add')}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {checklistTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-sm italic">{t('settings.noCustomQuestions')}</p>
                    </div>
                ) : (
                    checklistTemplates.map(template => (
                        <div key={template.id} className="flex justify-between items-center p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow group">
                            <div className="flex items-center gap-3">
                                <GripVertical size={16} className="text-gray-300 cursor-grab" />
                                <div>
                                    <span className="font-medium text-sm block text-gray-900">{template.label}</span>
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${template.phase === 'phone' ? 'bg-purple-100 text-purple-700' :
                                        template.phase === 'visit' ? 'bg-blue-100 text-blue-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {template.phase === 'phone' ? t('settings.phasesShort.phone') :
                                            template.phase === 'visit' ? t('settings.phasesShort.visit') :
                                                t('settings.phasesShort.signing')}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => removeTemplate(template.id)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title={t('common.delete')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

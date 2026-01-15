import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { CheckCircle, PartyPopper } from 'lucide-react';
import { api } from '../../services/api'; // For logging if we decide to use it later

const CHECKLIST_ITEMS = [
    { id: 1, text: '🧴 ¿Limpieza de mesones completada?' },
    { id: 2, text: '🔥 ¿Hornos y Gas apagados?' },
    { id: 3, text: '❄️ ¿Masa refrigerada correctamente?' },
    { id: 4, text: '🧹 ¿Piso barrido y trapeado?' },
    { id: 5, text: '🗑️ ¿Basura sacada?' }
];

const ClosingChecklistModal = ({ isOpen, onClose }) => {
    const [checkedItems, setCheckedItems] = useState({});
    const [isComplete, setIsComplete] = useState(false);

    const toggleItem = (id) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const allChecked = CHECKLIST_ITEMS.every(item => checkedItems[item.id]);

    const handleFinish = async () => {
        // Here we could save to DB
        // await api.logs.create({ type: 'CLOSING', user: 'current_user', timestamp: new Date() });

        setIsComplete(true);
        setTimeout(() => {
            onClose();
            // Reset for next time after a delay or keep state? 
            // Better to reset state when reopening or after closing
            setTimeout(() => {
                setIsComplete(false);
                setCheckedItems({});
            }, 500);
        }, 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rutina de Cierre Diaria">
            {isComplete ? (
                <div className="text-center py-12 animate-in zoom-in duration-300">
                    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <PartyPopper size={48} className="text-green-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">¡Todo listo!</h3>
                    <p className="text-gray-500 text-lg">A descansar. Excelente trabajo hoy.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <p className="text-gray-500 text-sm">Marca cada tarea completada antes de cerrar.</p>

                    <div className="space-y-3">
                        {CHECKLIST_ITEMS.map(item => (
                            <div
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`
                                    p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 group
                                    ${checkedItems[item.id]
                                        ? 'bg-green-50 border-green-200 shadow-sm'
                                        : 'bg-white border-gray-100 hover:border-gray-300'
                                    }
                                `}
                            >
                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${checkedItems[item.id]
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-gray-300 group-hover:border-green-400'
                                    }
                                `}>
                                    {checkedItems[item.id] && <CheckCircle size={14} strokeWidth={3} />}
                                </div>
                                <span className={`font-medium ${checkedItems[item.id] ? 'text-green-900 line-through opacity-70' : 'text-gray-700'}`}>
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleFinish}
                        disabled={!allChecked}
                        className={`
                            w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all
                            ${allChecked
                                ? 'bg-gray-900 text-white hover:bg-black hover:scale-[1.02]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        {allChecked ? 'Finalizar Turno' : 'Completa todas las tareas'}
                    </button>
                </div>
            )}
        </Modal>
    );
};

export default ClosingChecklistModal;

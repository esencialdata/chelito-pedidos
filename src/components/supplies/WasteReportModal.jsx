import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { api } from '../../services/api';
import { AlertTriangle, Trash2 } from 'lucide-react';

const WasteReportModal = ({ isOpen, onClose, onSuccess }) => {
    const [type, setType] = useState('product'); // 'product' or 'supply'
    const [list, setList] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cause, setCause] = useState('Caducado');
    const [loading, setLoading] = useState(false);
    const [costPreview, setCostPreview] = useState(0);

    // Load data based on type
    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            if (type === 'product') {
                const data = await api.products.list();
                setList(data);
            } else {
                const data = await api.supplies.list();
                setList(data);
            }
        };
        load();
    }, [isOpen, type]);

    // Calculate cost preview
    useEffect(() => {
        if (!selectedId || !quantity) {
            setCostPreview(0);
            return;
        }
        const item = list.find(i => i.id === selectedId);
        if (!item) return;

        let unitCost = 0;
        if (type === 'product') {
            unitCost = Number(item.calculated_cost || 0);
        } else {
            unitCost = Number(item.current_cost || 0);
        }
        setCostPreview(unitCost * Number(quantity));
    }, [selectedId, quantity, list, type]);

    const handleSubmit = async () => {
        if (!selectedId || !quantity) return;
        setLoading(true);
        try {
            const item = list.find(i => i.id === selectedId);
            const qty = Number(quantity);

            // 1. Deduct Stock
            if (type === 'supply') {
                await api.supplies.updateStock(selectedId, -qty);
            } else {
                // For products, update stock of ingredients based on recipe
                try {
                    const recipe = await api.recipes.getByProduct(selectedId);
                    // Deduct each ingredient
                    await Promise.all(recipe.map(ingredient => {
                        if (ingredient.supply && ingredient.supply.id) {
                            const deduction = Number(ingredient.quantity) * qty;
                            return api.supplies.updateStock(ingredient.supply.id, -deduction);
                        }
                        return Promise.resolve();
                    }));
                } catch (recipeError) {
                    console.error("Error updating ingredient stock for waste:", recipeError);
                    // Continue even if recipe stock update fails, to at least record financial loss
                }
            }

            // 2. Create GASTO Transaction
            await api.transactions.create({
                date: new Date().toISOString(),
                type: 'GASTO',
                amount: costPreview,
                description: `MERMA: ${item.name} (${qty}) - ${cause}`,
                payment_method: 'Pérdida Interna'
            });

            alert(`Merma reportada. Pérdida: $${costPreview.toFixed(2)}`);
            onSuccess();
            onClose();
            // Reset
            setQuantity('');
            setSelectedId('');
        } catch (e) {
            console.error(e);
            alert("Error al reportar merma");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reportar Merma">
            <div className="space-y-4">

                {/* Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => { setType('product'); setSelectedId(''); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'product' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                    >
                        Producto Terminado
                    </button>
                    <button
                        onClick={() => { setType('supply'); setSelectedId(''); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'supply' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                    >
                        Insumo / Materia Prima
                    </button>
                </div>

                {/* Item Select */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">¿Qué se desperdició?</label>
                    <select
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                    >
                        <option value="">Seleccionar...</option>
                        {list.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Cantidad</label>
                        <input
                            type="number"
                            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Causa</label>
                        <select
                            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            value={cause}
                            onChange={(e) => setCause(e.target.value)}
                        >
                            <option value="Caducado">Caducado</option>
                            <option value="Quemado">Quemado</option>
                            <option value="Caída">Caída / Accidente</option>
                            <option value="Prueba">Prueba de Calidad</option>
                            <option value="Defecto">Defecto de Fábrica</option>
                        </select>
                    </div>
                </div>

                {/* Warning / Cost Preview */}
                {costPreview > 0 && (
                    <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 text-red-700">
                        <AlertTriangle size={24} />
                        <div>
                            <p className="text-xs font-bold uppercase">Costo de la pérdida</p>
                            <p className="text-xl font-black">${costPreview.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading || !selectedId || !quantity}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 size={20} />
                    {loading ? 'Registrando...' : 'Confirmar Merma'}
                </button>
            </div>
        </Modal>
    );
};

export default WasteReportModal;

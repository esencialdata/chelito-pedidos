import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Calculator, Save, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';

const RecipeEditor = ({ isOpen, onClose, product, onSave }) => {
    const [ingredients, setIngredients] = useState([]);
    const [allSupplies, setAllSupplies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Batch calculator state
    const [batchSize, setBatchSize] = useState(1); // "Rinde para X unidades"

    useEffect(() => {
        if (isOpen && product) {
            loadData();
        }
    }, [isOpen, product]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [suppliesData, recipeData] = await Promise.all([
                api.supplies.list(),
                api.recipes.getByProduct(product.id)
            ]);

            // Group supplies for selection to avoid duplicates in dropdown
            const uniqueSupplies = Object.values(suppliesData.reduce((acc, item) => {
                if (!acc[item.name]) acc[item.name] = item;
                return acc;
            }, {}));

            setAllSupplies(uniqueSupplies);

            // Map existing recipe
            setIngredients(recipeData.map(r => ({
                supply_id: r.supply.id,
                name: r.supply.name,
                quantity: r.quantity, // This is unit quantity
                unit: r.unit,
                cost: r.cost_contribution,
                unit_cost: r.supply.current_cost
            })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { supply_id: '', quantity: '', unit: 'kg' }]);
    };

    const removeIngredient = (index) => {
        const newIng = [...ingredients];
        newIng.splice(index, 1);
        setIngredients(newIng);
    };

    const updateIngredient = (index, field, value) => {
        const newIng = [...ingredients];
        newIng[index][field] = value;

        if (field === 'supply_id') {
            const supply = allSupplies.find(s => s.id === value);
            if (supply) {
                newIng[index].name = supply.name;
                newIng[index].unit = supply.unit;
                newIng[index].unit_cost = supply.current_cost;
            }
        }
        setIngredients(newIng);
    };

    // Derived total cost (Unitary)
    const totalCost = ingredients.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unit_cost) || 0;
        // Batch adjustment is handled at input time, here we assume quantity is PER UNIT
        return sum + (qty * cost);
    }, 0);

    const handleSave = async () => {
        try {
            // If batch size > 1, we divide quantities? 
            // Better UX: Show "Cantidad Lote" and "Cantidad Unitaria" columns?
            // For simplicity: We save the *Unitary* quantity.
            // If user input was for a batch, they should have divided? 
            // No, user requested: "Input: ¿Para cuántas unidades rinde?". We divide automatically.

            const finalIngredients = ingredients.map(i => ({
                supply_id: i.supply_id,
                quantity: (Number(i.quantity) / Number(batchSize)).toFixed(4), // Divide by yield
                unit: i.unit
            }));

            await api.recipes.save(product.id, finalIngredients);
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar receta');
        }
    };

    if (!product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Receta: ${product.name}`}>
            <div className="space-y-6">

                {/* Batch Config */}
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-yellow-900 flex items-center gap-2">
                            <Calculator size={18} />
                            Calculadora de Lote
                        </h4>
                        <p className="text-xs text-yellow-700">
                            Ingresa las cantidades de tu mezcla y dinos cuánto rinde.
                        </p>
                    </div>
                    <div className="text-right">
                        <label className="block text-xs font-bold text-yellow-800 mb-1">Rendimiento (Unidades)</label>
                        <input
                            type="number"
                            min="1"
                            value={batchSize}
                            onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value)))}
                            className="w-20 p-2 text-center font-bold border-2 border-yellow-400 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                </div>

                {ingredients.length > 0 && batchSize === 1 && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                        <AlertCircle size={14} />
                        <span>Visualizando cantidades unitarias (por 1 pieza). Aumenta el rendimiento para calcular lotes.</span>
                    </div>
                )}

                {/* Ingredients List */}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-100 animate-fadeIn">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Insumo</label>
                                <select
                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                    value={ing.supply_id}
                                    onChange={(e) => updateIngredient(idx, 'supply_id', e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    {allSupplies.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">
                                    {batchSize > 1 ? 'Cant. Lote' : 'Cant. Unitaria'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.000"
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm text-center font-medium"
                                        value={ing.quantity}
                                        onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                                    />
                                    <span className="absolute right-2 top-2 text-xs text-gray-400">{ing.unit}</span>
                                </div>
                                {batchSize > 1 && (
                                    <p className="text-[10px] text-gray-400 mt-1 text-center">
                                        = {(Number(ing.quantity) / batchSize).toFixed(4)} / pza
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => removeIngredient(idx)}
                                className="mt-6 p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addIngredient}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Agregar Ingrediente
                    </button>
                </div>

                {/* Summary Footer */}
                <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500">Costo Lote ({batchSize} pzas)</span>
                        <span className="font-bold text-lg">${(totalCost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6 bg-green-50 p-3 rounded-xl border border-green-100">
                        <span className="text-green-800 font-bold">Costo Unitario Real</span>
                        <span className="font-black text-2xl text-green-700">
                            ${(totalCost / batchSize).toFixed(2)}
                        </span>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        <Save size={20} /> Guardar Receta
                    </button>
                </div>

            </div>
        </Modal>
    );
};

export default RecipeEditor;

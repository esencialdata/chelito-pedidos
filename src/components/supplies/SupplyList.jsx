import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Package, TrendingUp, TrendingDown, Minus, Layers, Pencil } from 'lucide-react';
import Modal from '../ui/Modal';
import WasteReportModal from './WasteReportModal';


const SupplyList = () => {
    const [supplies, setSupplies] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
    const [selectedSupply, setSelectedSupply] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadSupplies = async () => {
        try {
            const data = await api.supplies.list();
            setSupplies(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSupplies();
    }, []);

    const getPriceTrend = (supply) => {
        if (!supply.history || supply.history.length < 2) return { icon: <Minus size={16} className="text-gray-400" />, label: 'Estable' };

        // Sort by date descending (Newest first) to ensure correct comparison
        const sortedHistory = [...supply.history].sort((a, b) => new Date(b.date) - new Date(a.date));

        const current = Number(sortedHistory[0].price);
        const previous = Number(sortedHistory[1].price);

        if (current > previous) return { icon: <TrendingUp size={16} className="text-red-500" />, label: 'Subió', color: 'text-red-500' };
        if (current < previous) return { icon: <TrendingDown size={16} className="text-green-500" />, label: 'Bajó', color: 'text-green-500' };
        return { icon: <Minus size={16} className="text-gray-400" />, label: 'Estable' };
    };

    // Client-side grouping logic to cleanup bad data view (without deleting it for safety)
    const groupedSupplies = Object.values(supplies.reduce((acc, item) => {
        if (!acc[item.name]) {
            acc[item.name] = { ...item, total_stock: 0, ids: [] };
        }
        // Sum stock (if we had split stocks, though likely user just kept creating new zeroes)
        acc[item.name].total_stock += Number(item.current_stock || 0);
        acc[item.name].ids.push(item.id);
        // Keep latest cost/unit
        acc[item.name].current_cost = item.current_cost;
        acc[item.name].unit = item.unit;
        // Use the id of the first found or latest as the "main" id for updates?
        // This is tricky. simpler to just show list. 
        // User requested: "Visualización Única... tarjeta debe mostrar la suma total"
        return acc;
    }, {}));

    const handleOpenAdjust = (groupedItem) => {
        setSelectedSupply(groupedItem);
        setIsAdjustModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Insumos y Materia Prima</h3>
                    <p className="text-gray-500 text-sm">Controla el costo y stock de tus ingredientes</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsWasteModalOpen(true)}
                        className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-red-100 transition-colors flex items-center"
                    >
                        🚨 Reportar Merma
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition-colors flex items-center"
                    >
                        <Plus size={16} className="mr-2" />
                        Nuevo Ingrediente
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 animate-pulse text-gray-400">Cargando inventario...</div>
            ) : groupedSupplies.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Package className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">No hay insumos registrados</p>
                    <p className="text-gray-400 text-sm">Agrega harina, azúcar, gas, etc.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedSupplies.map((supply, idx) => {
                        const trend = getPriceTrend(supply);
                        return (
                            <button
                                key={idx}
                                onClick={() => handleOpenAdjust(supply)}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-primary/50 hover:shadow-md transition-all text-left w-full group"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 text-lg">{supply.name}</h4>
                                        {supply.ids.length > 1 && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded" title="Entradas fusionadas">
                                                <Layers size={10} />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Costo: ${Number(supply.current_cost).toFixed(2)} / {supply.unit}
                                        <span className={`ml-2 inline-flex items-center ${trend.color || 'text-gray-400'}`}>
                                            {trend.icon} {trend.label}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsCreateModalOpen(true); setSelectedSupply(supply); }}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar Detalles"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">En Stock</p>
                                        <p className="text-2xl font-black text-gray-900">
                                            {Number(supply.total_stock).toLocaleString()}
                                            <span className="text-sm text-gray-400 font-medium ml-1">{supply.unit}</span>
                                        </p>
                                        <span className="text-xs text-primary font-bold group-hover:underline">Ajustar Stock</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            <AddSupplyModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setSelectedSupply(null); }}
                onSuccess={() => { loadSupplies(); setIsCreateModalOpen(false); setSelectedSupply(null); }}
                initialData={selectedSupply}
            />

            <AdjustStockModal
                isOpen={isAdjustModalOpen}
                onClose={() => setIsAdjustModalOpen(false)}
                supply={selectedSupply}
                onSuccess={loadSupplies}
            />

            <WasteReportModal
                isOpen={isWasteModalOpen}
                onClose={() => setIsWasteModalOpen(false)}
                onSuccess={loadSupplies}
            />
        </div>
    );
};

const AddSupplyModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [unit, setUnit] = useState('kg');
    const [stock, setStock] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setCost(initialData.current_cost);
                setUnit(initialData.unit);
                // Stock shouldn't be edited here directly to avoid sync issues, or maybe yes?
                // Let's disable stock editing here and force usage of AdjustStock for auditing.
                setStock(initialData.total_stock || '');
            } else {
                setName('');
                setCost('');
                setUnit('kg');
                setStock('');
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                // Update
                await api.supplies.update(initialData.id, {
                    name,
                    current_cost: Number(cost),
                    unit
                    // We don't update stock here directly unless we want to reset it?
                    // Better to ignore stock update here to be safe and use usage logs.
                });
            } else {
                // Create
                await api.supplies.create({
                    name,
                    current_cost: Number(cost),
                    unit,
                    current_stock: Number(stock || 0)
                });
            }
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Insumo" : "Alta de Nuevo Insumo"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Insumo</label>
                    <input
                        required
                        type="text"
                        placeholder="Ej. Harina Selecta"
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
                        <input
                            required
                            type="number"
                            placeholder="0.00"
                            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                        <select
                            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary bg-white"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                        >
                            <option value="kg">kg</option>
                            <option value="lt">lt</option>
                            <option value="pza">pza</option>
                            <option value="costal">costal</option>
                            <option value="caja">caja</option>
                            <option value="gr">gr</option>
                        </select>
                    </div>
                </div>

                {!initialData && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial (Opcional)</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary bg-white"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold mt-4 hover:bg-black transition-colors"
                >
                    {loading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear en Catálogo')}
                </button>
            </form>
        </Modal>
    );
};

const AdjustStockModal = ({ isOpen, onClose, supply, onSuccess }) => {
    const [mode, setMode] = useState('add'); // 'add' or 'remove'
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    if (!supply) return null;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const delta = mode === 'add' ? Number(amount) : -Number(amount);
            // Update the primary record (first ID found in group)
            // Real-world: Should update specific batch or sum to singular record. 
            // We use supply.id (the one assigned during grouping, which is effectively the last one processed or first depending on iteration)
            // We grouped using Object.values, preserving one 'item's properties.
            await api.supplies.updateStock(supply.id, delta);
            setAmount('');
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Error updating stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ajustar Stock: ${supply.name}`}>
            <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setMode('add')}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${mode === 'add' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}
                    >
                        <Plus size={16} /> Entrada / Compra
                    </button>
                    <button
                        onClick={() => setMode('remove')}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${mode === 'remove' ? 'bg-white shadow-sm text-red-700' : 'text-gray-500'}`}
                    >
                        <Minus size={16} /> Salida / Merma
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-gray-500 mb-2">Cantidad a {mode === 'add' ? 'Agregar' : 'Restar'}</p>
                    <div className="flex items-center justify-center gap-3">
                        <input
                            type="number"
                            autoFocus
                            className="text-4xl font-black text-center w-40 border-b-2 border-gray-200 outline-none focus:border-primary bg-transparent"
                            placeholder="0"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                        <span className="text-xl font-bold text-gray-400">{supply.unit}</span>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <p className="text-blue-800 text-sm">
                        Stock Nuevo Resultante: <strong>{Math.max(0, Number(supply.total_stock) + (mode === 'add' ? Number(amount) : -Number(amount)))} {supply.unit}</strong>
                    </p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!amount || loading}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-colors ${mode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    {loading ? 'Actualizando...' : 'Confirmar Ajuste'}
                </button>
            </div>
        </Modal>
    );
};

export default SupplyList;

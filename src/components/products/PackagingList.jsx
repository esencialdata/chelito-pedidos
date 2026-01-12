import React, { useEffect, useState } from 'react';
import { api } from '../../services/api'; // Fix path if deeper
import { Box, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';

const PackagingList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const loadItems = async () => {
        try {
            const data = await api.packaging.list();
            setItems(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    if (loading) return <div className="text-center py-10 animate-pulse">Cargando inventario de empaques...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-700">
                        <Box size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Stock de Empaques</h3>
                        <p className="text-sm text-gray-500">Control de cajas, bolsas y desechables</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                    className="md:flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} className="mr-1" />
                    <span className="hidden md:inline">Agregar</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg">{item.type}</h4>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className={`text-2xl font-black ${item.current_quantity <= item.min_alert ? 'text-red-500' : 'text-gray-900'}`}>
                                        {item.current_quantity}
                                    </span>
                                    <span className="text-sm text-gray-400">unid.</span>
                                </div>
                            </div>
                            {item.current_quantity <= item.min_alert && (
                                <div className="bg-red-50 text-red-500 p-2 rounded-full animate-pulse" title="Stock Bajo">
                                    <AlertTriangle size={20} />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-sm">
                            <span className="text-gray-400">Mínimo: {item.min_alert}</span>
                            <button
                                onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors"
                            >
                                Editar / Ajustar
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400">No hay empaques registrados.</div>
                )}
            </div>

            <AddPackagingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={loadItems}
                initialData={editingItem}
            />
        </div>
    );
};

const AddPackagingModal = ({ isOpen, onClose, onSaved, initialData }) => {
    const [type, setType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [minAlert, setMinAlert] = useState(10);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setType(initialData.type);
                setQuantity(initialData.current_quantity);
                setMinAlert(initialData.min_alert);
            } else {
                setType('');
                setQuantity('');
                setMinAlert(10);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async () => {
        try {
            const payload = {
                type,
                current_quantity: Number(quantity),
                min_alert: Number(minAlert)
            };

            if (initialData) {
                await api.packaging.update(initialData.id, payload);
            } else {
                await api.packaging.create(payload);
            }
            onSaved();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error al guardar");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Empaque" : "Nuevo Empaque"}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Empaque</label>
                    <input
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none"
                        placeholder="Ej: Caja Rosca Chica"
                        value={type}
                        onChange={e => setType(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Actual</label>
                        <input
                            type="number"
                            className="w-full p-3 rounded-xl border border-gray-200 outline-none"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alerta Mínimo</label>
                        <input
                            type="number"
                            className="w-full p-3 rounded-xl border border-gray-200 outline-none"
                            value={minAlert}
                            onChange={e => setMinAlert(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!type || !quantity}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4"
                >
                    Guardar Inventario
                </button>
            </div>
        </Modal>
    );
};

export default PackagingList;

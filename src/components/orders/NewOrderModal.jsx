import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

import { api } from '../../services/api';
import { User, Calendar, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import AddClientModal from '../clients/AddClientModal';

const NewOrderModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [step, setStep] = useState(1);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    // Form State
    const [clientId, setClientId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [items, setItems] = useState([]); // { product: name, quantity: 1, price: 0 }
    const [notes, setNotes] = useState('');
    const [prepayment, setPrepayment] = useState(0);

    // UI Helpers
    const [tempProduct, setTempProduct] = useState(''); // Selected ID or Name
    const [tempQty, setTempQty] = useState(1);

    useEffect(() => {
        if (isOpen) {
            api.customers.list().then(setClients);
            api.products.list().then(setProducts);

            if (initialData) {
                // Edit Mode
                setClientId(initialData.client_id);
                const d = new Date(initialData.delivery_date);
                setDate(d.toISOString().split('T')[0]);
                // Time format needs to be HH:MM
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                setTime(`${hours}:${minutes}`);

                const loadedItems = Array.isArray(initialData.items) ? initialData.items : JSON.parse(initialData.items || '[]');
                setItems(loadedItems);

                setNotes(initialData.notes || '');
                setPrepayment(initialData.prepayment || 0);
            } else {
                // Create Mode
                const now = new Date();
                setDate(now.toISOString().split('T')[0]);
                setTime(`${now.getHours() + 1}:00`);
                setItems([]);
                setNotes('');
                setPrepayment(0);
            }
            setStep(1);
        }
    }, [isOpen, initialData]);

    const handleAddItem = () => {
        if (!tempProduct) return;

        let productData = products.find(p => p.id === tempProduct);
        const name = productData ? productData.name : tempProduct; // Allow custom name if no ID match
        const price = productData ? Number(productData.sale_price) : 0;

        setItems([...items, { product: name, quantity: tempQty, price }]);
        setTempProduct('');
        setTempQty(1);
    };

    const handleRemoveItem = (idx) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const calculateTotal = () => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSubmit = async () => {
        try {
            const deliveryDate = new Date(`${date}T${time}:00`).toISOString();
            const total = calculateTotal();

            const payload = {
                client_id: clientId,
                delivery_date: deliveryDate,
                items: items,
                total_amount: total, // Fix: Match DB column name
                prepayment: Number(prepayment),
                notes: notes,
                status: initialData ? initialData.status : 'PENDIENTE'
            };

            if (initialData) {
                await api.orders.update(initialData.id, payload);
            } else {
                await api.orders.create(payload);
            }
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error al guardar pedido");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Pedido">
            <div className="space-y-6">
                {/* STEP 1: WHO & WHEN */}
                {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <select
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 outline-none bg-white focus:ring-2 focus:ring-primary"
                                        value={clientId}
                                        onChange={e => setClientId(e.target.value)}
                                    >
                                        <option value="">Seleccionar Cliente</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.zone || 'Sin Zona'})</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setIsClientModalOpen(true)}
                                    className="bg-gray-100 p-3 rounded-xl hover:bg-gray-200"
                                    title="Nuevo Cliente"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega</label>
                                <input
                                    type="date"
                                    className="w-full p-3 rounded-xl border border-gray-200 outline-none"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                <input
                                    type="time"
                                    className="w-full p-3 rounded-xl border border-gray-200 outline-none"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            disabled={!clientId || !date || !time}
                            onClick={() => setStep(2)}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-4 shadow-lg disabled:opacity-50 disabled:shadow-none"
                        >
                            Siguiente: Agregar Pan
                        </button>
                    </div>
                )}

                {/* STEP 2: WHAT */}
                {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Producto</label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 p-3 rounded-xl border border-gray-200 outline-none bg-white"
                                    value={tempProduct}
                                    onChange={e => setTempProduct(e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.sale_price})</option>)}
                                </select>
                                <input
                                    type="number"
                                    className="w-20 p-3 rounded-xl border border-gray-200 outline-none text-center"
                                    value={tempQty}
                                    min="1"
                                    onChange={e => setTempQty(e.target.value)}
                                />
                                <button
                                    onClick={handleAddItem}
                                    className="bg-gray-900 text-white p-3 rounded-xl"
                                >
                                    <Plus />
                                </button>
                            </div>
                        </div>

                        {/* Order Summary List */}
                        <div className="bg-gray-50 rounded-xl p-4 min-h-[150px]">
                            {items.length === 0 ? (
                                <p className="text-gray-400 text-center py-10 text-sm">Agrega productos a la orden</p>
                            ) : (
                                <ul className="space-y-2">
                                    {items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                            <span className="text-sm font-bold text-gray-800">{item.quantity}x {item.product}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-500">${item.price * item.quantity}</span>
                                                <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-4 border-t border-gray-100 pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Total Pedido</span>
                                <span className="text-xl font-bold text-gray-900">${calculateTotal()}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Anticipo Recibido</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">$</span>
                                    <input
                                        type="number"
                                        className="w-24 p-2 border border-gray-200 rounded-lg text-right font-bold outline-none focus:ring-2 focus:ring-primary"
                                        value={prepayment}
                                        onChange={e => setPrepayment(e.target.value)}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <span className="text-gray-700 font-bold">Saldo Pendiente</span>
                                <span className="text-xl font-black text-red-500">
                                    ${Math.max(0, calculateTotal() - Number(prepayment))}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Requerimientos</label>
                            <textarea
                                className="w-full p-3 rounded-xl border border-gray-200 outline-none resize-none h-20 bg-white"
                                placeholder="Ej: Entregar por la puerta de servicio, Sin cebolla, etc."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 text-gray-500 font-bold"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={items.length === 0}
                                className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
                            >
                                Confirmar Pedido
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AddClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onClientAdded={async (newClient) => {
                    const latestClients = await api.customers.list(); // Refresh full list
                    setClients(latestClients);
                    if (newClient && newClient.id) {
                        setClientId(newClient.id); // Auto-select new client
                    }
                }}
            />
        </Modal>
    );
};

export default NewOrderModal;

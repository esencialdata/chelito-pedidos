import React, { useState, useEffect } from 'react';
import { Plus, Minus, User, Save, ShoppingBag } from 'lucide-react';
import Modal from '../ui/Modal';
import { api } from '../../services/api';

export const TransactionFABS = ({ onTransactionAdded }) => {
    const [isSaleOpen, setIsSaleOpen] = useState(false);
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);

    const handleSuccess = () => {
        setIsSaleOpen(false);
        setIsExpenseOpen(false);
        if (onTransactionAdded) onTransactionAdded();
    };

    return (
        <>
            <div className="fixed bottom-24 right-4 flex flex-col space-y-4 items-end pointer-events-none">
                {/* Floating buttons container - pointer events auto on buttons */}

                {/* Expense Button */}
                <button
                    onClick={() => setIsExpenseOpen(true)}
                    className="pointer-events-auto flex items-center bg-red-100 text-red-600 px-4 py-2 rounded-full shadow-lg hover:bg-red-200 transition-transform active:scale-95 font-bold"
                >
                    <Minus size={20} className="mr-2" />
                    Gasto
                </button>

                {/* Sale Button - Primary */}
                <button
                    onClick={() => setIsSaleOpen(true)}
                    className="pointer-events-auto flex items-center bg-primary text-white px-6 py-3 rounded-full shadow-xl hover:bg-yellow-600 transition-transform active:scale-95 font-bold text-lg"
                >
                    <Plus size={24} className="mr-2" />
                    Venta
                </button>
            </div>

            <AddTransactionModal
                isOpen={isSaleOpen}
                onClose={() => setIsSaleOpen(false)}
                type="VENTA"
                onSuccess={handleSuccess}
            />
            <AddTransactionModal
                isOpen={isExpenseOpen}
                onClose={() => setIsExpenseOpen(false)}
                type="GASTO"
                onSuccess={handleSuccess}
            />
        </>
    );
};

const AddTransactionModal = ({ isOpen, onClose, type, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [clientId, setClientId] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSupplyId, setSelectedSupplyId] = useState('');
    const [supplies, setSupplies] = useState([]);
    const [purchaseQty, setPurchaseQty] = useState(''); // New state for stock add

    useEffect(() => {
        if (isOpen) {
            if (type === 'VENTA') {
                api.customers.list().then(setClients).catch(console.error);
            } else {
                // Load supplies for expenses
                api.supplies.list().then(setSupplies).catch(console.error);
            }
            setPurchaseQty(''); // Reset qty
        }
    }, [isOpen, type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Transaction
            await api.transactions.create({
                type,
                amount: Number(amount),
                description: type === 'VENTA' ? description || 'Venta Rápida' : description,
                client_id: clientId || null,
                supply_id: selectedSupplyId || null, // Link to supply
                payment_method: 'Efectivo',
            });

            // 2. If Expense + Supply + Qty > 0 -> ADD TO STOCK AND UPDATE PRICE
            if (type === 'GASTO' && selectedSupplyId && Number(purchaseQty) > 0) {
                const qty = Number(purchaseQty);
                const totalAmount = Number(amount);
                const newUnitCost = totalAmount / qty;

                // Find the current supply to get proper stock baseline
                const currentSupply = supplies.find(s => String(s.id) === String(selectedSupplyId));
                const currentStock = Number(currentSupply?.current_stock || 0);
                const newStock = currentStock + qty;

                console.log(`Updating Supply ${selectedSupplyId}: Cost ${newUnitCost}, Stock ${newStock} (+${qty})`);

                // Perform ONE update for both Price and Stock to ensure consistency
                await api.supplies.update(selectedSupplyId, {
                    current_cost: newUnitCost,
                    current_stock: newStock
                });
            }

            setAmount('');
            setDescription('');
            setClientId('');
            setSelectedSupplyId('');
            setPurchaseQty('');
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const isSale = type === 'VENTA';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isSale ? "Nueva Venta" : "Registrar Gasto"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total ($)</label>
                    <input
                        type="number"
                        required
                        autoFocus
                        className="w-full text-4xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-primary outline-none py-2 placeholder-gray-300"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                {isSale ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Producto / Descripción</label>
                            <div className="relative">
                                <ShoppingBag className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Ej. Rosca Grande"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                >
                                    <option value="">Cliente General / Mostrador</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Concepto o Insumo</label>
                        {/* Toggle between text or select? For now, let's offer Select if supplies exist */}
                        {supplies.length > 0 ? (
                            <div className="space-y-2">
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-200 outline-none mb-2"
                                    value={selectedSupplyId}
                                    onChange={(e) => {
                                        setSelectedSupplyId(e.target.value);
                                        const s = supplies.find(sup => sup.id === e.target.value);
                                        if (s) setDescription(s.name);
                                    }}
                                >
                                    <option value="">-- Seleccionar Insumo (Opcional) --</option>
                                    {supplies.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (Actual: ${s.current_cost})</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-200 outline-none"
                                    placeholder="O escribe el concepto..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        ) : (
                            <input
                                type="text"
                                required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-200 outline-none"
                                placeholder="Ej. Gas, Harina, Luz"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        )}
                    </div>
                )}

                {/* Checkbox to update price? Only if supply selected */}
                {type === 'GASTO' && selectedSupplyId && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <div className="flex items-start gap-2">
                            <span className="text-xl">📦</span>
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-blue-900 mb-1">
                                    ¿Entró inventario de este insumo?
                                </label>
                                <p className="text-xs text-blue-700 mb-2">
                                    Si agregas cantidad aquí, se sumará automáticamente a tus Insumos.
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="w-24 p-2 text-center font-bold border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="0"
                                        value={purchaseQty}
                                        onChange={(e) => setPurchaseQty(e.target.value)}
                                    />
                                    <span className="text-sm font-bold text-gray-500">
                                        {supplies.find(s => s.id === selectedSupplyId)?.unit || 'unid'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !amount}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center mt-6
            ${isSale
                            ? 'bg-primary text-white hover:bg-yellow-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                    {loading ? 'Guardando...' : (
                        <>
                            <Save size={20} className="mr-2" />
                            {isSale ? 'Cobrar Venta' : 'Registrar Gasto'}
                        </>
                    )}
                </button>
            </form>
        </Modal>
    );
};

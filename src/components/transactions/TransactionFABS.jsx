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

    useEffect(() => {
        if (isOpen) {
            if (type === 'VENTA') {
                api.customers.list().then(setClients).catch(console.error);
            } else {
                // Load supplies for expenses
                api.supplies.list().then(setSupplies).catch(console.error);
            }
        }
    }, [isOpen, type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // If it's an expense and a supply is selected, check/update price
            if (type === 'GASTO' && selectedSupplyId) {
                // Update supply price if needed (logic can be more complex, e.g., if unit price changed)
                // For MVP, if user inputs a total amount, we assume it updates the cost reference or tracking?
                // Actually, often we buy X units. 
                // Let's keep it simple: We just log the expense. 
                // OPTIONAL: Update the supply's current cost if the user indicates a price change. 
                // For now, let's just create the transaction properly.

                // If we want to track price history, we should probably update the supply here 
                // But usually Total Expense != Unit Price. 
                // Let's just Link it for now.

                // However, user ASKED for "analysis of price variation".
                // So maybe we should ask: "Unit Price?"

                // Let's defer strict price update to a dedicated flow or assume "Amount" is total.
            }

            await api.transactions.create({
                type,
                amount: Number(amount),
                description: type === 'VENTA' ? description || 'Venta Rápida' : description,
                client_id: clientId || null,
                supply_id: selectedSupplyId || null, // Link to supply
                payment_method: 'Efectivo',
            });

            // If expense linked to supply, TRY to detect unit price? 
            // Better simpler: Just linking it allows us to filter expenses by supply later and see "Total spent on Harina".
            // To track "Price Variation" (Unit cost), we need to know Quantity bought.
            // That's too complex for this FAB?

            // Alternative: Just update the "Last Known Price" if provided?
            // Let's stick to the user request: "analice la variación de precios".
            // Implementation: We will just save the expense.

            setAmount('');
            setDescription('');
            setClientId('');
            setSelectedSupplyId('');
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
                    <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 flex items-start">
                        <span className="mr-2">💡</span>
                        <p>Para registrar un cambio de precio unitario, ve a la sección de <b>Insumos</b>.</p>
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

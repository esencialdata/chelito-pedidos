import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Calendar, CheckCircle, Clock, MapPin, Plus, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, isAfter, startOfDay, addDays, isBefore, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import NewOrderModal from './NewOrderModal';

const OrdersView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const loadOrders = async () => {
        try {
            const data = await api.orders.list();
            setOrders(data.filter(o => o.status === 'PENDIENTE')); // Only show pending
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    // Categorize Orders
    const today = new Date();

    const todayOrders = orders.filter(o => isToday(parseISO(o.delivery_date)));
    const tomorrowOrders = orders.filter(o => isTomorrow(parseISO(o.delivery_date)));
    const futureOrders = orders.filter(o => {
        const d = parseISO(o.delivery_date);
        return !isToday(d) && !isTomorrow(d) && isAfter(d, startOfDay(today));
    });

    const handleComplete = async (order) => {
        if (window.confirm(`¿Confirmar entrega a ${order.customers?.name}? Se registrará la venta.`)) {
            const remaining = Number(order.total_amount) - Number(order.prepayment || 0);

            try {
                await api.orders.complete(order.id, remaining, {
                    type: 'VENTA',
                    amount: remaining,
                    description: `Entrega Pedido: ${order.customers?.name}`,
                    client_id: order.client_id,
                    payment_method: 'Efectivo', // Default
                    date: new Date().toISOString()
                });
                loadOrders(); // Refresh
            } catch (e) {
                console.error(e);
                alert('Error al completar pedido');
            }
        }
    };

    const handleEdit = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleDelete = async (order) => {
        if (window.confirm(`¿Seguro que quieres eliminar el pedido de ${order.customers?.name}? Esta acción no se puede deshacer.`)) {
            try {
                await api.orders.delete(order.id);
                loadOrders();
            } catch (e) {
                console.error(e);
                alert('Error al eliminar');
            }
        }
    };

    const [showProductionModal, setShowProductionModal] = useState(false);
    const [productionPlan, setProductionPlan] = useState(null);
    const [calculating, setCalculating] = useState(false);

    const handleOpenProduction = async () => {
        setShowProductionModal(true);
        setCalculating(true);
        setProductionPlan(null);

        try {
            // 1. Summarize Products to Bake (Today + 2 Days)
            const summary = {};
            const itemsToProcess = [];
            const limitDate = addDays(startOfDay(new Date()), 2);

            const productionOrders = orders.filter(o => {
                const d = parseISO(o.delivery_date);
                // Orders for today or future dates up to limitDate (inclusive)
                return (isToday(d) || isAfter(d, startOfDay(new Date()))) &&
                    (isBefore(d, limitDate) || isSameDay(d, limitDate));
            });

            productionOrders.forEach(order => {
                const items = Array.isArray(order.items) ? order.items : (JSON.parse(order.items || '[]'));
                items.forEach(item => {
                    const name = item.product || item.name;
                    summary[name] = (summary[name] || 0) + Number(item.quantity);
                    itemsToProcess.push({ name, quantity: Number(item.quantity) });
                });
            });

            // Production List for UI
            const productList = Object.entries(summary).map(([name, total]) => ({ name, total }));

            // 2. Calculate Ingredients
            // We need product IDs to fetch recipes. Let's fetch all products first.
            const allProducts = await api.products.list();
            const allSupplies = await api.supplies.list();

            const ingredientTotals = {}; // { supplyId: { name, unit, required, stock } }

            for (const item of itemsToProcess) {
                // Find product by name (heuristic)
                const product = allProducts.find(p => p.name === item.name);
                if (product) {
                    const recipe = await api.recipes.getByProduct(product.id);
                    recipe.forEach(rItem => {
                        const supplyId = rItem.supply.id;
                        const requiredAmount = Number(rItem.quantity) * item.quantity;

                        if (!ingredientTotals[supplyId]) {
                            const supply = allSupplies.find(s => s.id === supplyId);
                            ingredientTotals[supplyId] = {
                                name: rItem.supply.name,
                                unit: rItem.unit,
                                required: 0,
                                stock: supply ? Number(supply.current_stock) : 0
                            };
                        }
                        ingredientTotals[supplyId].required += requiredAmount;
                    });
                }
            }

            // Convert to array and determine status
            const ingredients = Object.values(ingredientTotals).map(i => ({
                ...i,
                missing: Math.max(0, i.required - i.stock),
                status: (i.required - i.stock) > 0 ? 'shortage' : 'ok'
            }));

            setProductionPlan({ products: productList, ingredients });

        } catch (e) {
            console.error(e);
            alert("Error calculando producción");
        } finally {
            setCalculating(false);
        }
    };

    const copyMissing = () => {
        if (!productionPlan) return;
        const shortages = productionPlan.ingredients.filter(i => i.missing > 0);
        if (shortages.length === 0) return alert('¡Tienes todo lo necesario! 👨‍🍳');

        let text = `🛒 *Faltantes para Hoy* (Generado por CDM)\n\n`;
        shortages.forEach(item => {
            text += `[ ] ${item.missing.toFixed(2)} ${item.unit} de ${item.name}\n`;
        });
        navigator.clipboard.writeText(text);
        alert('Lista de faltantes copiada');
    };

    return (
        <div className="space-y-6 mb-24 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Agenda de Cocina</h2>
                    <p className="text-gray-500">Tus pedidos y entregas pendientes</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleOpenProduction}
                        className="bg-white text-gray-700 border border-gray-200 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center"
                    >
                        <Clock size={20} className="mr-2 text-gray-500" />
                        Ver Producción
                    </button>
                    <button
                        onClick={() => { setSelectedOrder(null); setIsModalOpen(true); }}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-yellow-600 transition-colors flex items-center">
                        <Plus size={20} className="mr-2" />
                        Nuevo Pedido
                    </button>
                </div>
            </div>

            {/* Production Modal */}
            {showProductionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowProductionModal(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Producción (Próx. 3 días)</h3>
                            <button onClick={() => setShowProductionModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        {calculating ? (
                            <div className="py-12 text-center text-gray-500 animate-pulse">
                                Calculando explosión de insumos...
                            </div>
                        ) : (
                            <>
                                {(!productionPlan || productionPlan.products.length === 0) ? (
                                    <p className="text-center text-gray-500 py-8">No hay pedidos para hoy.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Products List */}
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">A Hornear</h4>
                                            <ul className="grid grid-cols-2 gap-2">
                                                {productionPlan.products.map((item, idx) => (
                                                    <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-gray-700 font-medium">{item.name}</span>
                                                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg font-black">
                                                            {item.total}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <hr className="border-gray-100" />

                                        {/* Ingredients List */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Insumos Requeridos</h4>
                                                <button
                                                    onClick={copyMissing}
                                                    className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1 transition-colors"
                                                >
                                                    <AlertCircle size={14} /> Copiar Faltantes
                                                </button>
                                            </div>

                                            <div className="grid gap-3 max-h-[40vh] overflow-y-auto pr-1">
                                                {productionPlan.ingredients.length === 0 ? (
                                                    <div className="text-center py-4 text-gray-400 text-sm">No se requieren insumos (o falta configurar recetas).</div>
                                                ) : (
                                                    productionPlan.ingredients.map((item, idx) => (
                                                        <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${item.status === 'shortage' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{item.name}</p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Nec: <strong>{Number(item.required).toFixed(2)} {item.unit}</strong> • Stock: {Number(item.stock).toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                {item.status === 'ok' ? (
                                                                    <div className="text-green-600">
                                                                        <CheckCircle size={20} className="ml-auto" />
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider">OK</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-red-600">
                                                                        <AlertCircle size={20} className="ml-auto" />
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 block">Faltan</span>
                                                                        <span className="font-black text-sm block">
                                                                            {Number(item.missing).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowProductionModal(false)}
                                className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* TODAY */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-red-600 font-bold uppercase tracking-wider text-sm sticky top-0 bg-background z-10 py-2">
                        <AlertCircle size={16} /> HOY ({todayOrders.length})
                    </div>
                    {todayOrders.length === 0 && <p className="text-gray-400 text-sm italic">Nada para hoy (¡Descanso merecido!)</p>}
                    {todayOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onComplete={() => handleComplete(order)}
                            onEdit={() => handleEdit(order)}
                            onDelete={() => handleDelete(order)}
                            urgent
                        />
                    ))}
                </section>

                {/* TOMORROW */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-600 font-bold uppercase tracking-wider text-sm sticky top-0 bg-background z-10 py-2">
                        <Clock size={16} /> MAÑANA ({tomorrowOrders.length})
                    </div>
                    {tomorrowOrders.length === 0 && <p className="text-gray-400 text-sm italic">Sin entregas mañana.</p>}
                    {tomorrowOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onComplete={() => handleComplete(order)}
                            onEdit={() => handleEdit(order)}
                            onDelete={() => handleDelete(order)}
                        />
                    ))}
                </section>

                {/* FUTURE */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-wider text-sm sticky top-0 bg-background z-10 py-2">
                        <Calendar size={16} /> PRÓXIMOS
                    </div>
                    {futureOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onComplete={() => handleComplete(order)}
                            onEdit={() => handleEdit(order)}
                            onDelete={() => handleDelete(order)}
                        />
                    ))}
                </section>
            </div>

            <NewOrderModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedOrder(null); }}
                onSuccess={loadOrders}
                initialData={selectedOrder}
            />
        </div>
    );
};

const OrderCard = ({ order, onComplete, onEdit, onDelete, urgent }) => {
    const formattedTime = format(parseISO(order.delivery_date), 'h:mm a');
    const displayDate = format(parseISO(order.delivery_date), "EEE d MMM", { locale: es });
    const items = Array.isArray(order.items) ? order.items : (JSON.parse(order.items || '[]'));

    return (
        <div className={`bg-white rounded-xl shadow-sm border-l-4 p-4 relative group transition-all hover:shadow-md ${urgent ? 'border-l-red-500' : 'border-l-blue-400'}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className={`text-2xl font-black ${urgent ? 'text-red-600' : 'text-gray-800'}`}>{formattedTime}</span>
                    {!urgent && <span className="text-xs text-gray-400 ml-2 uppercase font-bold">{displayDate}</span>}
                </div>
                {order.customers?.zone && (
                    <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        <MapPin size={12} className="mr-1" />
                        {order.customers.zone}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{order.customers?.name || 'Cliente'}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded">
                        <Pencil size={16} />
                    </button>
                    <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <ul className="text-sm text-gray-600 space-y-1 my-3 border-t border-dashed border-gray-100 pt-2">
                {items.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                        <span>{item.quantity}x {item.product}</span>
                    </li>
                ))}
            </ul>

            {order.notes && (
                <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded-lg mb-2 italic">
                    "{order.notes}"
                </div>
            )}

            <div className="flex justify-between items-center mt-4">
                <div className="text-xs text-gray-400">
                    Pendiente: <span className="font-bold text-gray-700">${Number(order.total_amount || 0) - Number(order.prepayment || 0)}</span>
                </div>
                <button
                    onClick={onComplete}
                    className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 font-bold text-xs"
                >
                    <CheckCircle size={14} />
                    <span>ENTREGAR</span>
                </button>
            </div>
        </div>
    );
};

export default OrdersView;

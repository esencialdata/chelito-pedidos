import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ClipboardList, ShoppingCart, Check, AlertOctagon, RefreshCw, Calculator, Copy } from 'lucide-react';

const ProductionPlanner = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [plan, setPlan] = useState(null); // { ingredients: [], totalCost: 0 }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await api.products.list();
            setProducts(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const calculatePlan = async () => {
        if (!selectedProduct || !quantity) return;
        setLoading(true);
        try {
            // 1. Get Recipe
            const recipe = await api.recipes.getByProduct(selectedProduct);

            // 2. Get Current Stock (Snapshot)
            const supplies = await api.supplies.list();

            // 3. Calculate Requirements
            const requirements = recipe.map(item => {
                const totalRequired = Number(item.quantity) * Number(quantity);
                const currentStock = supplies.find(s => s.id === item.supply.id)?.current_stock || 0;
                const missing = Math.max(0, totalRequired - currentStock);

                return {
                    name: item.supply.name,
                    unit: item.unit,
                    required: totalRequired,
                    stock: currentStock,
                    missing: missing,
                    status: missing > 0 ? 'shortage' : 'ok'
                };
            });

            setPlan({
                productName: products.find(p => p.id === selectedProduct)?.name,
                quantity: quantity,
                ingredients: requirements
            });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const copyShoppingList = () => {
        if (!plan) return;

        const shortages = plan.ingredients.filter(i => i.missing > 0);
        if (shortages.length === 0) {
            alert('¡Todo cubierto! No hay faltantes.');
            return;
        }

        let text = `🛒 *Lista de Compras - BakeryOS*\n`;
        text += `Para producir: ${plan.quantity}x ${plan.productName}\n\n`;

        shortages.forEach(item => {
            text += `[ ] ${Number(item.missing).toFixed(3)} ${item.unit} de ${item.name}\n`;
        });

        text += `\nGenerado el ${new Date().toLocaleDateString()}`;

        navigator.clipboard.writeText(text);
        alert('Lista copiada al portapapeles');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Calculator className="text-yellow-400" />
                            Planificador de Producción
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Calcula insumos exactos para tu horneado</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Input Section */}
                <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-gray-700 mb-1">¿Qué vamos a hornear?</label>
                        <select
                            className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-primary bg-white"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                            <option value="">Seleccionar Producto...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-32">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Cantidad</label>
                        <input
                            type="number"
                            min="1"
                            placeholder="0"
                            className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-primary text-center font-bold"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={calculatePlan}
                        disabled={loading || !selectedProduct || !quantity}
                        className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <Calculator size={20} />}
                        Calcular
                    </button>
                </div>

                {/* Results Section */}
                {plan && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 text-lg">
                                Requerimientos para {plan.quantity}x {plan.productName}
                            </h3>
                            <button
                                onClick={copyShoppingList}
                                className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg hover:bg-green-100 flex items-center gap-1"
                            >
                                <Copy size={16} /> Copiar Faltantes
                            </button>
                        </div>

                        <div className="grid gap-3">
                            {plan.ingredients.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 italic">Este producto no tiene receta configurada.</div>
                            ) : (
                                plan.ingredients.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${item.status === 'shortage' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                                            <p className="text-sm text-gray-500">
                                                Necesitas: <strong>{Number(item.required).toFixed(3)} {item.unit}</strong>
                                                <span className="mx-2">|</span>
                                                Tienes: {Number(item.stock).toFixed(3)} {item.unit}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {item.status === 'ok' ? (
                                                <div className="flex flex-col items-end text-green-600">
                                                    <Check size={24} strokeWidth={3} />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Cubierto</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end text-red-600">
                                                    <AlertOctagon size={24} />
                                                    <span className="text-xs font-bold uppercase tracking-wider mt-1">Faltan</span>
                                                    <span className="font-black text-lg">
                                                        {Number(item.missing).toFixed(3)} {item.unit}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductionPlanner;

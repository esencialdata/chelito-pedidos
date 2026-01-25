import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Package, ChefHat, ArrowRight, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const ProductionView = () => {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [productionQuantities, setProductionQuantities] = useState({});
    const [recipes, setRecipes] = useState({}); // Map productId -> recipe items
    const [loading, setLoading] = useState(true);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prods, ords] = await Promise.all([
                api.products.list(),
                api.orders.list()
            ]);
            setProducts(prods.filter(p => p.active !== false)); // Only active products
            setOrders(ords.filter(o => o.status === 'PENDIENTE'));

            // Load recipes for all products to enable real-time calculation
            setLoadingRecipes(true);
            const recipeMap = {};
            for (const p of prods) {
                try {
                    const r = await api.recipes.getByProduct(p.id);
                    recipeMap[p.id] = r;
                } catch (e) {
                    console.error(`Error loading recipe for ${p.name}`, e);
                }
            }
            setRecipes(recipeMap);
            setLoadingRecipes(false);

        } catch (error) {
            console.error("Error loading production data", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Load suggestions from pending orders
    const loadSuggestions = () => {
        const suggestions = {};
        orders.forEach(order => {
            let items = [];
            if (Array.isArray(order.items)) {
                items = order.items;
            } else if (typeof order.items === 'string') {
                try { items = JSON.parse(order.items); } catch (e) { }
            }

            items.forEach(item => {
                // Find product ID by name if necessary, or use ID if available
                // The current order structure stores product *Game*. We need to match with products list.
                const product = products.find(p => p.name.toLowerCase() === item.product.toLowerCase());
                if (product) {
                    suggestions[product.id] = (suggestions[product.id] || 0) + Number(item.quantity);
                }
            });
        });
        setProductionQuantities(suggestions);
        setSuccessMsg('Sugerencia cargada basada en pedidos pendientes');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleQuantityChange = (productId, delta) => {
        setProductionQuantities(prev => {
            const current = prev[productId] || 0;
            const newVal = Math.max(0, current + delta);
            if (newVal === 0) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: newVal };
        });
    };

    // Calculate Total Ingredient Usage
    const ingredientImpact = useMemo(() => {
        const impact = {}; // supplyId -> { name, quantity, unit }

        Object.entries(productionQuantities).forEach(([prodId, qty]) => {
            const prodRecipes = recipes[prodId] || [];
            prodRecipes.forEach(ingredient => {
                // Recipe item: { supply_id, quantity, unit, supply: { name, ... } }
                const supplyId = ingredient.supply_id || ingredient.supply?.id;
                const supplyName = ingredient.supply?.name || 'Desconocido';
                const required = Number(ingredient.quantity) * qty;

                if (impact[supplyId]) {
                    impact[supplyId].quantity += required;
                } else {
                    impact[supplyId] = {
                        name: supplyName,
                        quantity: required,
                        unit: ingredient.unit,
                        current_stock: ingredient.supply?.current_stock
                    };
                }
            });
        });
        return Object.values(impact);
    }, [productionQuantities, recipes]);

    const handleConfirmProduction = async () => {
        setSubmitting(true);
        try {
            // 1. Deduct Inventory
            const impactList = ingredientImpact;
            for (const item of impactList) {
                // Find supply ID from the impact list values isn't direct, we constructed it from values.
                // We need the supply ID. Re-map or store it.
                // Let's refactor ingredientImpact to store key as ID for easier lookup or include ID in value.
            }

            // Re-looping for deduction using the aggregated Map strategy would be safer.
            // Let's do it inside this function to be sure.
            const updates = {}; // supplyId -> totalDeduction

            Object.entries(productionQuantities).forEach(([prodId, qty]) => {
                const prodRecipes = recipes[prodId] || [];
                prodRecipes.forEach(ing => {
                    const sId = ing.supply_id || ing.supply?.id;
                    if (sId) {
                        updates[sId] = (updates[sId] || 0) + (Number(ing.quantity) * qty);
                    }
                });
            });

            const promises = Object.entries(updates).map(([supplyId, deduction]) =>
                api.supplies.updateStock(supplyId, -deduction)
            );

            await Promise.all(promises);

            setSuccessMsg('¡Producción registrada! Inventario actualizado.');
            setProductionQuantities({});
            setShowSummary(false);
            // Optional: Refresh data to get new stock levels?
        } catch (error) {
            console.error("Error confirming production", error);
            alert("Error al registrar producción");
        } finally {
            setSubmitting(false);
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    if (loading) return <div className="p-10 text-white text-center">Cargando centro de control...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-32">
            {/* Header */}
            <div className="bg-gray-800 p-6 shadow-lg border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-orange-400">
                        <ChefHat className="w-8 h-8" />
                        Centro de Producción
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión de horneado y control de insumos</p>
                </div>

                <div className="flex gap-4">
                    {successMsg && (
                        <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg flex items-center gap-2 animate-fade-in">
                            <CheckCircle size={18} /> {successMsg}
                        </div>
                    )}
                    <button
                        onClick={loadSuggestions}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-xl transition-all border border-gray-600"
                    >
                        <RefreshCw size={18} />
                        Cargar Pedidos Pendientes
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">

                {/* Empty State */}
                {products.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No hay productos activos configurados.
                    </div>
                )}

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(product => {
                        const qty = productionQuantities[product.id] || 0;
                        const hasRecipe = recipes[product.id] && recipes[product.id].length > 0;

                        return (
                            <div key={product.id} className={`bg-gray-800 rounded-2xl p-6 border transition-all ${qty > 0 ? 'border-orange-500 shadow-orange-500/10 shadow-lg' : 'border-gray-700 shadow-md'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-gray-100 leading-tight">{product.name}</h3>
                                    {!hasRecipe && (
                                        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded" title="Sin receta configurada">
                                            No Link
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between bg-gray-900 rounded-xl p-1 gap-2">
                                    <button
                                        onClick={() => handleQuantityChange(product.id, -1)}
                                        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-2xl font-bold"
                                    >
                                        -
                                    </button>
                                    <span className={`text-2xl font-bold font-mono ${qty > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
                                        {qty}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange(product.id, 1)}
                                        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-2xl font-bold"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Micro-interaction: Ingredient Preview */}
                                {qty > 0 && hasRecipe && (
                                    <div className="mt-4 pt-3 border-t border-gray-700">
                                        <p className="text-xs text-gray-500 mb-1">Impacto estimado:</p>
                                        <div className="space-y-1">
                                            {recipes[product.id].slice(0, 2).map((ing, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-gray-400">
                                                    <span>{ing.supply?.name}</span>
                                                    <span className="text-gray-300">{(Number(ing.quantity) * qty).toFixed(2)} {ing.unit}</span>
                                                </div>
                                            ))}
                                            {recipes[product.id].length > 2 && (
                                                <p className="text-xs text-gray-600 italic">+ {recipes[product.id].length - 2} más...</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer / Summary Panel - Modified to be always visible if items selected */}
            {Object.keys(productionQuantities).length > 0 && (
                <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 animate-slide-up">
                    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 items-center justify-between">

                        {/* Summary Stats */}
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-semibold">
                                <Package size={16} /> Resumen de Insumos
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {ingredientImpact.slice(0, 5).map((ing, i) => (
                                    <div key={i} className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-700 min-w-[140px]">
                                        <div className="text-xs text-gray-500 truncate">{ing.name}</div>
                                        <div className="text-orange-400 font-mono font-bold">
                                            -{ing.quantity.toFixed(1)} <span className="text-xs text-gray-600">{ing.unit}</span>
                                        </div>
                                    </div>
                                ))}
                                {ingredientImpact.length > 5 && (
                                    <div className="flex items-center justify-center px-4 text-gray-500 text-xs">
                                        + {ingredientImpact.length - 5} más
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 w-full md:w-auto">
                            <button
                                onClick={() => setProductionQuantities({})}
                                className="px-6 py-4 rounded-xl text-gray-400 hover:text-white font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmProduction}
                                disabled={submitting}
                                className="flex-1 md:flex-none px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                            >
                                {submitting ? 'Procesando...' : 'CONFIRMAR TANDA'}
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionView;

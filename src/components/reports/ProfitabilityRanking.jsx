import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Award, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const ProfitabilityRanking = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.products.list();
                const processed = data
                    .filter(p => p.sale_price && p.sale_price > 0) // Valid products only
                    .map(p => {
                        const cost = Number(p.calculated_cost) || Number(p.production_cost) || 0;
                        const price = Number(p.sale_price);
                        const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
                        const profit = price - cost;
                        return { ...p, margin, profit };
                    })
                    .sort((a, b) => b.margin - a.margin); // Sort desc (Highest first)

                setProducts(processed);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="text-gray-400 py-6 text-center animate-pulse">Analizando márgenes...</div>;
    if (products.length === 0) return <div className="text-gray-400 py-6 text-center">Sin datos de productos suficientes.</div>;

    const top3 = products.slice(0, 3);
    const bottom3 = products.slice(-3).reverse(); // Worst 3, but show worst first or last? Let's show bottom 3.

    return (
        <div className="space-y-6">
            {/* Top Stars */}
            <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    <Award size={16} className="text-yellow-500" /> Estrellas de ganancia
                </h4>
                <div className="space-y-2">
                    {top3.map((p, idx) => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-white border border-yellow-100 rounded-xl relative overflow-hidden group">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-6 h-6 rounded-full bg-yellow-200 text-yellow-700 flex items-center justify-center text-xs font-black">
                                    {idx + 1}
                                </div>
                                <span className="font-bold text-gray-800">{p.name}</span>
                            </div>
                            <div className="text-right relative z-10">
                                <span className="block font-black text-green-600 text-lg">{p.margin.toFixed(0)}%</span>
                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Margen</span>
                            </div>
                            {/* Hover detail */}
                            <div className="absolute inset-0 bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs font-bold text-gray-600">Ganas ${p.profit.toFixed(2)} por venta</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Alert */}
            <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">
                    <AlertTriangle size={16} className="text-red-400" /> Requieren Atención
                </h4>
                <div className="space-y-2">
                    {bottom3.map((p, idx) => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400">
                            <div className="flex items-center gap-3">
                                <TrendingDown size={16} className="text-red-300" />
                                <span className="font-medium text-gray-600">{p.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-red-400">{p.margin.toFixed(0)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfitabilityRanking;

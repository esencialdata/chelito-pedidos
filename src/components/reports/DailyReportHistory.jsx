import React, { useMemo, useState } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, DollarSign, TrendingDown, TrendingUp, Calendar, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';

const DailyReportHistory = ({ transactions }) => {
    // Group transactions by day
    const dailyData = useMemo(() => {
        const groups = {};

        transactions.forEach(tx => {
            // Ensure we have a valid date string YYYY-MM-DD
            const dateObj = new Date(tx.date);
            const dateKey = format(dateObj, 'yyyy-MM-dd');

            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: dateObj,
                    income: 0,
                    expenses: 0,
                    transactions: []
                };
            }

            const amount = Number(tx.amount);
            if (tx.type === 'VENTA') {
                groups[dateKey].income += amount;
            } else {
                groups[dateKey].expenses += amount;
            }

            groups[dateKey].transactions.push(tx);
        });

        // Convert to array and sort descending (newest first)
        return Object.values(groups).sort((a, b) => b.date - a.date);
    }, [transactions]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Historial Diario</h2>
                    <p className="text-sm text-gray-500">Resumen detallado día a día</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyData.map((dayData) => (
                    <DailyCard key={dayData.date.toISOString()} data={dayData} />
                ))}

                {dailyData.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        No hay transacciones registradas aún.
                    </div>
                )}
            </div>
        </div>
    );
};

const DailyCard = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const balance = data.income - data.expenses;
    const isProfit = balance >= 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
            {/* Header Card */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 text-gray-600 font-bold text-xs uppercase px-2 py-1 rounded-md">
                            {format(data.date, 'MMM', { locale: es })}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg capitalize">
                            {format(data.date, 'EEEE d', { locale: es })}
                        </h3>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                        isProfit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isProfit ? "Positivo" : "Déficit"}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                            <TrendingUp size={14} className="text-green-500" /> Ingresos
                        </span>
                        <span className="font-bold text-gray-900">${data.income.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                            <TrendingDown size={14} className="text-red-500" /> Gastos
                        </span>
                        <span className="font-medium text-gray-600">${data.expenses.toFixed(2)}</span>
                    </div>

                    <div className="pt-3 border-t border-gray-50 mt-3 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Balance Neto</span>
                        <span className={cn(
                            "text-lg font-black",
                            isProfit ? "text-gray-900" : "text-red-600"
                        )}>
                            {isProfit ? '+' : ''}${balance.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Toggle Details */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            >
                {isExpanded ? (
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        Ocultar detalles <ChevronUp size={16} />
                    </span>
                ) : (
                    <span className="text-xs font-medium text-primary flex items-center gap-1">
                        Ver desglose <ChevronDown size={16} />
                    </span>
                )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="bg-gray-50 px-5 pb-5 pt-2 border-t border-gray-100 block animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">
                        {/* Mini Transactions list could go here, for now simpler stats */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Resumen de Actividad</h4>
                            <div className="bg-white p-3 rounded-xl border border-gray-200 text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Transacciones</span>
                                    <span className="font-medium">{data.transactions.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ticket Promedio (Ventas)</span>
                                    <span className="font-medium">
                                        ${(data.income / (data.transactions.filter(t => t.type === 'VENTA').length || 1)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {data.transactions.map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-gray-100">
                                    <span className="text-gray-600 truncate max-w-[120px]">{tx.description}</span>
                                    <span className={cn(
                                        "font-bold",
                                        tx.type === 'VENTA' ? "text-green-600" : "text-red-500"
                                    )}>
                                        {tx.type === 'VENTA' ? '+' : '-'}${Number(tx.amount).toFixed(0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyReportHistory;

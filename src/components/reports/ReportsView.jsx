import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import BalanceSummary from './BalanceSummary';
import ExpenseBreakdown from './ExpenseBreakdown';
import InflationTracker from './InflationTracker';
import ProfitabilityRanking from './ProfitabilityRanking';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { TrendingUp, PieChart, AlertTriangle } from 'lucide-react';

import DailyReportHistory from './DailyReportHistory';
import { LayoutGrid, CalendarDays } from 'lucide-react';

const ReportsView = () => {
    const [transactions, setTransactions] = useState([]);
    const [supplies, setSupplies] = useState([]);
    const [viewMode, setViewMode] = useState('general'); // 'general' or 'daily'
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txData, suppliesData] = await Promise.all([
                    api.transactions.list(),
                    api.supplies.list()
                ]);
                setTransactions(txData);
                setSupplies(suppliesData);
            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter transactions based on selected date range for General View
    const filteredTransactions = transactions.filter(tx => {
        if (!tx.date) return false;
        return isWithinInterval(parseISO(tx.date), {
            start: dateRange.start,
            end: dateRange.end
        });
    });

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando análisis financiero...</div>;

    return (
        <div className="space-y-6 pb-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="text-primary" />
                        Reportes Financieros
                    </h1>
                    <p className="text-gray-500 text-sm">Salud financiera y variación de costos</p>
                </div>

                {/* View Toggles */}
                <div className="flex p-1 bg-gray-100 rounded-xl self-start md:self-auto">
                    <button
                        onClick={() => setViewMode('general')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'general'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <LayoutGrid size={18} />
                        General
                    </button>
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'daily'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <CalendarDays size={18} />
                        Por Día
                    </button>
                </div>
            </header>

            {viewMode === 'general' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* 1. Balance General & KPIs */}
                    <section>
                        <BalanceSummary
                            transactions={filteredTransactions}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                        />
                    </section>

                    {/* Grid for Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 2. Desglose de Gastos */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <PieChart size={20} />
                                </div>
                                <h2 className="font-bold text-gray-900">Gastos</h2>
                            </div>
                            <ExpenseBreakdown transactions={filteredTransactions} />
                        </section>

                        {/* 3. Inflation Tracker */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <AlertTriangle size={20} />
                                </div>
                                <h2 className="font-bold text-gray-900">Variación Precios</h2>
                            </div>
                            <InflationTracker supplies={supplies} dateRange={dateRange} />
                        </section>

                        {/* 4. Profitability Ranking - NEW */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                                    <TrendingUp size={20} />
                                </div>
                                <h2 className="font-bold text-gray-900">Top Rentabilidad</h2>
                            </div>
                            <ProfitabilityRanking />
                        </section>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <DailyReportHistory transactions={transactions} />
                </div>
            )}

        </div>
    );
};

export default ReportsView;

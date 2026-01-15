import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, isSameDay } from 'date-fns';
import TransactionList from '../transactions/TransactionList';
import ProductionPlanner from '../production/ProductionPlanner';
import ClosingChecklistModal from './ClosingChecklistModal';
import { CheckCircle } from 'lucide-react';

const Dashboard = ({ refreshTrigger }) => {
    const [metrics, setMetrics] = useState({
        income: 0,
        expenses: 0,
        goal: 0,
        percent: 0,
        isProfit: false
    });
    const [loading, setLoading] = useState(true);
    const [stockAlerts, setStockAlerts] = useState([]);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

    const calculatePulse = async () => {
        try {
            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd');

            const [txs, config, packaging] = await Promise.all([
                api.transactions.list(),
                api.config.get(),
                api.packaging.list()
            ]);

            // Debug Logging for User/Dev
            console.log("Dashboard - Checking Dates:", { todayStr, totalTxs: txs.length });

            // Stock Alerts
            const alerts = packaging.filter(p => p.current_quantity <= p.min_alert);
            setStockAlerts(alerts);

            // Filter using isSameDay for robustness
            const todayTxs = txs.filter(t => {
                const txDate = new Date(t.date);
                const isToday = isSameDay(txDate, now);
                // console.log(`Tx ${t.id} (${t.date}): isToday=${isToday}`); // Uncomment for verbose debug
                return isToday;
            });
            console.log("Found today transactions:", todayTxs.length);

            const income = todayTxs
                .filter(t => t.type === 'VENTA')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const variableExpenses = todayTxs
                .filter(t => t.type === 'GASTO')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const dailyFixedCost = Number(config.monthly_fixed_costs) / 30;
            const target = dailyFixedCost + variableExpenses; // The "Break Even" point for today

            const percent = target > 0 ? (income / target) * 100 : (income > 0 ? 100 : 0);

            setMetrics({
                income,
                expenses: variableExpenses,
                goal: target,
                percent: Math.min(percent, 100), // Cap for bar width, but value can be higher
                rawValue: percent,
                isProfit: percent >= 100
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculatePulse();
        // Simulate real-time by polling or simple load
        const interval = setInterval(calculatePulse, 5000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando pulso...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Resumen Financiero</h2>
                    <p className="text-gray-500">Panorama general de tu panadería</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-full border border-gray-100 text-sm font-medium text-gray-600 shadow-sm">
                    {format(new Date(), 'dd MMMM yyyy')}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Pulse Card - Feature */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between h-full relative overflow-hidden min-h-[300px]">

                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 bg-yellow-50 w-32 h-32 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none" />

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <h3 className="text-lg font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Diaria</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-gray-900 tracking-tight">
                                    ${metrics.income.toFixed(0)}
                                </span>
                                <span className="text-xl text-gray-400 font-medium">
                                    / ${metrics.goal.toFixed(0)}
                                </span>
                            </div>
                        </div>

                        {metrics.isProfit && (
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-xs flex items-center shadow-sm whitespace-nowrap">
                                <TrendingUp size={16} className="mr-2" />
                                ¡META SUPERADA!
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 relative z-10">
                        {/* Progress Bar */}
                        <div className="h-8 w-full bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                                    metrics.isProfit ? "bg-success" : "bg-primary"
                                )}
                                style={{ width: `${metrics.percent}%` }}
                            />
                        </div>

                        <div className="flex justify-between text-sm font-medium text-gray-500">
                            <span>Inicio</span>
                            <span>{metrics.percent.toFixed(0)}% Completado</span>
                            <span>Meta</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard
                        title="Ventas Totales"
                        value={`$${metrics.income.toFixed(2)}`}
                        trend="+12% vs ayer"
                        trendUp={true}
                        icon={<DollarSign className="text-yellow-600" size={24} />}
                        bg="bg-yellow-50"
                    />
                    <StatCard
                        title="Gastos Hoy"
                        value={`$${metrics.expenses.toFixed(2)}`}
                        trend="Controlado"
                        icon={<TrendingDown className="text-red-500" size={24} />}
                        bg="bg-red-50"
                    />
                    {/* Placeholder for future stats - Keeping layout balanced */}
                    <div className="sm:col-span-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-6 text-white flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-gray-300 text-sm font-medium mb-1">Resultado Neto (Hoy)</p>
                            <p className="text-3xl font-bold">
                                {metrics.income - metrics.expenses > 0 ? '+' : ''}${(metrics.income - metrics.expenses).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-full">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Alerts */}
            {stockAlerts.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl animate-bounce-slow">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <TrendingDown className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                ¡Atención! Quedan pocos empaques
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    {stockAlerts.map(item => (
                                        <li key={item.id}>
                                            Solo quedan <strong>{item.current_quantity}</strong> unidades de {item.type} (Mínimo: {item.min_alert})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Production Planner - NEW */}
            <ProductionPlanner />

            {/* Recent Transactions Section */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h3>
                <TransactionList limit={5} refreshTrigger={refreshTrigger} />
            </div>

            {/* Closing Checklist Trigger */}
            <div className="flex justify-start md:justify-end pt-4 pb-24 md:pb-8">
                <button
                    onClick={() => setIsClosingModalOpen(true)}
                    className="group bg-white border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all p-4 rounded-2xl flex items-center gap-4"
                >
                    <div className="bg-green-100 text-green-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <CheckCircle size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900">Rutina de Cierre</p>
                        <p className="text-xs text-gray-500 group-hover:text-green-600">Finalizar turno correctamente</p>
                    </div>
                </button>
            </div>

            <ClosingChecklistModal
                isOpen={isClosingModalOpen}
                onClose={() => setIsClosingModalOpen(false)}
            />
        </div>
    );
};

const StatCard = ({ title, value, trend, trendUp, icon, bg }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`${bg} p-3 rounded-2xl`}>
                {icon}
            </div>
            {trend && (
                <span className={cn("text-xs font-bold px-2 py-1 rounded-lg", trendUp ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
        </div>
    </div>
);

export default Dashboard;

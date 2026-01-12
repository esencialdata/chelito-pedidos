import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

const TransactionList = ({ limit = 5, refreshTrigger }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadTransactions = async () => {
        try {
            const data = await api.transactions.list();
            setTransactions(limit ? data.slice(0, limit) : data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, [refreshTrigger]);

    if (loading) return <div className="text-center py-4 text-gray-400">Cargando movimientos...</div>;

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Wallet className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 text-sm">No hay movimientos recientes</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Movimientos Recientes</h3>
            <div className="space-y-3">
                {transactions.map((tx) => (
                    <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tx.type === 'VENTA' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {tx.type === 'VENTA' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{tx.description || (tx.type === 'VENTA' ? 'Venta' : 'Gasto')}</p>
                                <p className="text-xs text-gray-500">{format(new Date(tx.date), 'dd MMM HH:mm')}</p>
                            </div>
                        </div>
                        <span className={`font-bold ${tx.type === 'VENTA' ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.type === 'VENTA' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionList;

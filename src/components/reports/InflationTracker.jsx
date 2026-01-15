import React from 'react';
import { TrendingUp, Minus } from 'lucide-react';

const InflationTracker = ({ supplies, dateRange }) => {

    const alerts = React.useMemo(() => {
        const list = [];
        const start = dateRange?.start || new Date(0);
        const end = dateRange?.end || new Date();

        supplies.forEach(supply => {
            if (!supply.history || supply.history.length === 0) return;

            // Sort history by date asc for easier timeline traversal
            const sortedHistory = [...supply.history].sort((a, b) => new Date(a.date) - new Date(b.date));

            // Find price at Start of period (Last entry where date <= start)
            // If no entry exists before start, it means the item didn't exist or had no history. 
            // Fallback: If the item was created *during* the period, use its first recorded price in period.
            let startPriceItem = sortedHistory.filter(h => new Date(h.date) <= start).pop();

            // If no history before start, check if there's history within the period
            if (!startPriceItem) {
                const firstInPeriod = sortedHistory.find(h => new Date(h.date) >= start && new Date(h.date) <= end);
                if (firstInPeriod) startPriceItem = firstInPeriod;
            }

            // Find price at End of period (Last entry where date <= end)
            // If no entry <= end, maybe it was created after? (Shouldn't happen if we strictly follow range)
            let endPriceItem = sortedHistory.filter(h => new Date(h.date) <= end).pop();

            if (!startPriceItem || !endPriceItem) return;

            const startPrice = Number(startPriceItem.price);
            const endPrice = Number(endPriceItem.price);

            if (startPrice === endPrice) return; // No Net Variation

            const variation = ((endPrice - startPrice) / startPrice) * 100;

            list.push({
                id: supply.id,
                name: supply.name,
                currentPrice: endPrice,
                prevPrice: startPrice,
                variation: variation,
                unit: supply.unit
            });
        });

        // Sort by highest increase first
        return list.sort((a, b) => b.variation - a.variation);

    }, [supplies, dateRange]);

    if (alerts.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <p className="text-center px-4">No hubo variaciones de precio en este periodo</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {alerts.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                            ${Number(item.prevPrice).toFixed(2)} ➡️ <span className="font-bold text-gray-900">${Number(item.currentPrice).toFixed(2)}</span> / {item.unit}
                        </p>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
                        ${item.variation > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {item.variation > 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
                        {item.variation > 0 ? '+' : ''}{item.variation.toFixed(1)}%
                    </div>
                </div>
            ))}
        </div>
    );
};

export default InflationTracker;

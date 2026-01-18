import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#8884d8', '#82ca9d'];

const ExpenseBreakdown = ({ transactions }) => {

    const data = React.useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'GASTO');
        const grouped = {};

        expenses.forEach(tx => {
            // Group by description
            const key = tx.description ? tx.description.trim() : 'Otros';
            // Capitalize first letter for consistency
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();

            if (!grouped[formattedKey]) grouped[formattedKey] = 0;
            grouped[formattedKey] += Number(tx.amount);
        });

        const sortedData = Object.keys(grouped).map(name => ({
            name,
            value: grouped[name]
        })).sort((a, b) => b.value - a.value);

        // Group into "Otros" if we have too many segments
        if (sortedData.length > 6) {
            const top5 = sortedData.slice(0, 5);
            const others = sortedData.slice(5);
            const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

            return [
                ...top5,
                { name: 'Otros', value: othersTotal }
            ];
        }

        return sortedData;

    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p>No hay gastos registrados</p>
            </div>
        );
    }

    return (
        <div className="h-72 w-full flex flex-col items-center">
            {/* Height increased slightly for legend */}
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%" // Move up slightly to make room for legend
                        innerRadius={65}
                        outerRadius={85}
                        fill="#8884d8"
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false} // Explicitly disable lines
                        label={false} // Explicitly disable text labels on the chart itself
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke="#fff" />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => `$${value.toFixed(2)}`}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpenseBreakdown;

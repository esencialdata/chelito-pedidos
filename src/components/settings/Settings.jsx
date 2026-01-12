import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Save } from 'lucide-react';

const Settings = () => {
    const [activeConfig, setActiveConfig] = useState({ monthly_fixed_costs: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.config.get().then(data => {
            setActiveConfig(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.config.update(activeConfig);
            alert('Configuración guardada');
        } catch (e) {
            console.error(e);
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Configuración Financiera</h2>

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Costos Fijos Mensuales</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-400 font-bold">$</span>
                        <input
                            type="number"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-lg"
                            value={activeConfig.monthly_fixed_costs}
                            onChange={(e) => setActiveConfig({ ...activeConfig, monthly_fixed_costs: Number(e.target.value) })}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Incluye Renta, Luz, Gas, Sueldos fijos. Esto se usa para calcular tu meta diaria (costo / 30).
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-yellow-600 transition-colors flex justify-center items-center"
                >
                    <Save size={20} className="mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </form>
        </div>
    );
};

export default Settings;

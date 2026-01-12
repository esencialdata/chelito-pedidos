import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { api } from '../../services/api';
import { Package, DollarSign, Calculator } from 'lucide-react';

const AddProductModal = ({ isOpen, onClose, onProductSaved, initialData = null }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sale_price: '',
        production_cost: '',
        active: true
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData(initialData);
        } else if (isOpen) {
            setFormData({ name: '', sale_price: '', production_cost: '', active: true });
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData && initialData.id) {
                await api.products.update(initialData.id, formData);
            } else {
                await api.products.create(formData);
            }
            onProductSaved();
            onClose();
            setFormData({ name: '', sale_price: '', production_cost: '', active: true });
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Producto" : "Nuevo Producto"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    <div className="relative">
                        <Package className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            required
                            type="text"
                            placeholder="Ej. Concha de Vainilla"
                            className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                required
                                type="number"
                                step="0.50"
                                placeholder="0.00"
                                className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                value={formData.sale_price}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Producción</label>
                        <div className="relative">
                            <Calculator className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                required
                                type="number"
                                step="0.50"
                                placeholder="0.00"
                                className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                value={formData.production_cost}
                                onChange={(e) => setFormData({ ...formData, production_cost: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <input
                        type="checkbox"
                        id="active"
                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <label htmlFor="active" className="text-gray-700 font-medium cursor-pointer">Producto Activo / Disponible</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 mt-6"
                >
                    {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
            </form>
        </Modal>
    );
};

export default AddProductModal;
